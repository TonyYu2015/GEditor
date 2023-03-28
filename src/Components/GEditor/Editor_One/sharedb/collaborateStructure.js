import cloneDeep from "lodash/cloneDeep";
import isFunction from "lodash/isFunction";
import Quill from "quill";
import * as json1 from "ot-json1";
import richText from "rich-text";
import { OP_TYPES } from "../consts";
const {
	RETAIN,
	DELETE,
	INSERT,
	UPDATE
} = OP_TYPES;

const D_RETAIN = "retain";
const D_DELETE = "delete";
const D_INSERT = "insert";

const UNDEFINED = undefined;
const NULL = null;
const CHILDREN_KEY = "_children";

const Delta = Quill.import("delta");

export default class CollborateStruc {
	data;

	constructor(data, nestContainer, isInitial) {
		if (isInitial) {
			let initialData = cloneDeep(nestContainer);
			initialData._children[0]._children.push(data);
			delete initialData._children[0].startIndex;
			delete initialData._children[0].endIndex;
			this.data = initialData;
		} else {
			this.data = data;
		}
	}

	transformToOperation({ delta, nest }) {
		this.opDelta = new Delta(cloneDeep(delta));
		this.operations = [];
		console.log("=====>>>>> [操作前数据]", this.data);
		this.cloneNest = cloneDeep(nest);
		while(this.cloneNest.length > 0) {
			let curNest = this.cloneNest.pop();
			this.findTheNest(curNest);
		}

		let composeOperations = this.operations.reduce(json1.type.compose, null);
		console.log("=====>>>>> [操作数据]", composeOperations);

		let [newDelta, onlyNest] = this.applyOperation(composeOperations);

		console.log("=====>>>>> [操作后数据]", this.data);
		return [composeOperations, newDelta, onlyNest];
	}

	checkIsHasChildren(parent, nest) {
		return nest.find(item => {
			return item.parentKey === parent.key;
		})
	}

	applyOperation(op) {
		this.data = json1.type.apply(this.data, op);
		this.transformDelta();
		return this.seperate();
	}

	findTheNest(opNest) {
		let path = [];
		Dfs(this.data, item => {
			if ((!opNest.parentKey || item.node.key === opNest.parentKey) && opNest.opType === INSERT) {
				path.push(item.index, CHILDREN_KEY);
				this.insertNest(item.node, path, opNest);
				return false;
			}
			if (opNest.key === item.node.key) {
				switch (opNest.opType) {
					case RETAIN:
						this._editDelta(item.node, [...path, item.index, CHILDREN_KEY], opNest);
						break;
					case DELETE:
						this.operations.push(json1.removeOp([...path, item.index]));
						break;
					case UPDATE:
						this.diffNest([...path, item.index], opNest);
						break;
				}
				return false;
			}
			if (item.index === null) {
				path.push(CHILDREN_KEY);
			} else if (item.node.ops) {
				path.push(item.index);
			} else {
				path.push(item.index, CHILDREN_KEY);
			}
		}, item => {
			if (item.index !== null && !item.node.ops) {
				path.pop();
			}
			path.pop();
		});

	}

	diffNest(path, opNest) {
		let prev = opNest.prev;
		let next = opNest.next;
		Object.keys(prev).forEach(it => {
			if (!next[it]) {
				this.operations.push(json1.removeOp([...path, it]));
			} else if (prev[it] !== next[it]) {
				this.operations.push(json1.replaceOp([...path, it], prev[it], next[it]));
			}
		});

		Object.keys(next).forEach(it => {
			if (!prev[it]) {
				this.operations.push(json1.insertOp([...path, it], next[it]));
			}
		});
	}

	insertNest(node, path, opNest) {
		let operations = [];
		let insertLocation, insertDelta, offset = 0, curIndex = this.getCurNestStartIndex(node);

		node._children.find((it, i) => {
			let preIndex = curIndex;
			if (it.ops) {
				curIndex += new Delta(it).length();
			} else {
				curIndex += this.getNestItemLength(it);
			}
			if (opNest.startIndex === curIndex) {
				insertLocation = i + 1;
				return true;
			} else if (opNest.startIndex < curIndex) {
				insertDelta = it;
				offset = opNest.startIndex - preIndex;
				operations.push(
					json1.editOp(
						[...path, i],
						richText.type,
						[
							{ retain: opNest.startIndex - preIndex },
							{ delete: curIndex - opNest.startIndex }
						].filter(it => !(it.retain !== UNDEFINED && it.retain === 0))
					)
				);
				insertLocation = i + 1;
				return true;
			}
		});

		Dfs(opNest, _ => { }, item => {
			let node = item.node;
			let curNodeIndex = node.startIndex, nodeEndIndex = node.endIndex;
			node._children = node._children.reduce((m, it) => {
				if (it.startIndex === curNodeIndex) {
					curNodeIndex = it.endIndex;
					m.push(it);
					return m;
				} else {
					m.push(this.opDelta.slice(curNodeIndex, it.startIndex));
					m.push(it);
					curNodeIndex = it.endIndex;
					return m;
				}
			}, []);

			if (curNodeIndex < nodeEndIndex) {
				node._children.push(this.opDelta.slice(curNodeIndex, nodeEndIndex));
			}
		});

		operations.push(json1.insertOp([...path, insertLocation], this.filterInsertKeys(opNest)));
		if (insertDelta) {
			operations.push(json1.insertOp([...path, insertLocation + 1], new Delta(insertDelta).slice(offset)));
		}
		this.operations.push(operations.reduce(json1.type.compose, null));
	}

	_editDelta(node, path, opNest) {
		let operations = [];
		let movingIndex = opNest.startIndex;
		let opDeltaLen = new Delta(this.opDelta).length();

		for(let i = 0, len = node._children.length; i < len; i++) {
			if(movingIndex >= opDeltaLen) {
				break;
			}
			let item = node._children[i];
			if(!item.ops) {
				movingIndex += this.getNestItemLength(item);
				continue;
			}
			let preMovingIndex = movingIndex;
			movingIndex += new Delta(item).length();
			operations.push(json1.editOp([...path, i], richText.type, this.opDelta.slice(preMovingIndex, movingIndex)));
		}
		this.operations.push(operations.reduce(json1.type.compose, null));
	}

	editDelta(item, path, opNest) {
		let movingIndex = opNest.startIndex;
		let movingI, docLen;
		let newOp = [];
		let opIter = Delta.Op.iterator(this.opDelta.ops);
		let opOp, opLength, opIndex = 0, docEndIndex;
		while (opIter.hasNext()) {
			opOp = opIter.peek();
			if (opOp.retain === 0) {
				opIter.next();
				continue;
			}
			opLength = opOp.retain || opOp.delete || opOp.insert.length || 1;

			if (opIndex === 0) {
				item._children.find((it, i) => {
					docLen = it.ops ? new Delta(it).length() : this.getNestItemLength(it);
					if (it.ops && (movingIndex + docLen >= opLength)) {
						movingI = i;
						return true;
					}
					movingIndex += docLen;
				});
				docEndIndex = movingIndex + docLen;
			}
			opIndex += opLength;

			if (opIndex < docEndIndex) {
				if (opIter.peekType() === D_RETAIN) {
					if (opIndex - movingIndex !== 0) {
						newOp.push({ retain: opIndex - movingIndex });
					}
				} else {
					newOp.push(opOp);
				}
				opIter.next();
				if (!opIter.hasNext()) {
					this.operations.push(json1.editOp([...path, movingI], richText.type, newOp));
					break;
				}
			} else if (opIndex == docEndIndex) {
				if (opIter.peekType() !== D_RETAIN) {
					newOp.push(opOp);
				}
				opIter.next();
				this.operations.push(json1.editOp([...path, movingI], richText.type, newOp));
				newOp = [];
			} else if (opIndex > docEndIndex) {
				let diffLen = docEndIndex - (opIndex - opLength);
				let type = opIter.peekType();
				if (type === D_INSERT) {
					newOp.push({ insert: opOp.insert.substr(0, diffLen + 1) });
				} else {
					newOp.push({ delete: diffLen });
				}
				this.operations.push(json1.editOp([...path, movingI], richText.type, newOp));
				newOp = [];
				opIter.next(diffLen);
			}
		}
	}

	AfterApplyOperation(op) {
		console.log("%c======>>>>> [应用操作前] <<<<<<<============", "color: white; background: black;");
		console.log("======>>>>> [操作] <<<<<<<============", op);
		console.log("======>>>>> [数据] <<<<<<<============", this.data);
		let invertData = this.getInvertData(op, cloneDeep(this.data));

		let [newDelta, onlyNest] = this.applyOperation(op);
		console.log("%c=====>>>>>> [应用操作后] <<<<<<<<============", "color: white; background: green;");
		console.log("=====>>>>>> [转换后数据] <<<<<<<<============", invertData);
		console.log("=====>>>>>> [数据] <<<<<<<<============", this.data);
		console.log("=====>>>>>> [提取的delta] <<<<<<<<============", newDelta);
		console.log("=====>>>>>> [提取的nest] <<<<<<<<============", onlyNest);
		return [invertData, newDelta, onlyNest];
	}

	getInvertData(operation, cloneData) {
		this.invertDelta = new Delta();
		this.invertNest = [];
		this.cursiveInvertData(operation, cloneData, null);
		// this.filterDeltaFromNest();
		return [this.invertDelta, this.invertNest];
	}

	filterDeltaFromNest() {
		this.invertNest.forEach(data => {
			this.cursiveFilterDeltaFromNest(data);
		});
	}

	cursiveFilterDeltaFromNest(data) {
		data._children = data._children.filter(item => {
			if (item.ops) {
				return false;
			} else {
				this.cursiveFilterDeltaFromNest(item);
				return true;
			}
		})
	}

	flushInvertData() {
		let iter = Delta.Op.iterator(this.invertDelta.ops);
		let tmpDelta = new Delta(), start = 0;
		while (iter.hasNext()) {
			if (iter.peekType() === D_RETAIN) {
				let op = iter.peek();
				tmpDelta = tmpDelta.push(op);
				start += op.retain;
			} else if (iter.peekType() === D_INSERT) {
				let op = iter.peek();
				tmpDelta = tmpDelta.push(op);
				start += iter.peekLength();
			} else if (iter.peekType() === D_DELETE) {
				let op = iter.peek();
				start -= op.delete;
				tmpDelta = tmpDelta.slice(0, start);
			}
			iter.next();
		}
		this.invertDelta = tmpDelta;
	}

	pushToInvertNest(item) {
		let isFind = this.invertNest.find(it => {
			return item.key === it.key;
		});
		if (!isFind) {
			this.invertNest.push(item);
		} else if (isFind && isFind.opType === RETAIN && item.opType !== RETAIN) {
			this.invertNest = this.invertNest.filter(it => {
				return it.key !== item.key;
			}).push(item);
		}
	}

	filterInvertNest(item) {
		this.invertNest = this.invertNest.filter(it => it.key !== item.key);
	}

	cursiveInvertData(operation, item, itemParent) {
		operation.reduce((data, listItem) => {
			if (typeof listItem === "number" || typeof listItem === "string") {
				if (data[1] === null) {
					return [data[0][listItem], data[0], null, listItem];
				} else {
					return [data[0][listItem], data[0], data[1], listItem];
				}
			} else if (Array.isArray(listItem)) {
				this.cursiveInvertData(listItem, data[0], data[1]);
				return data;
			} else if (typeof listItem === "object") {
				if (listItem.e !== UNDEFINED) {
					let curStartIndex = this.getCurDeltaStartIndex(data[2], data[3]);
					this.invertDelta = new Delta().retain(curStartIndex).concat(new Delta(listItem.e));
					this.pushToInvertNest({ ...data[2], _children: [], opType: RETAIN, startIndex: this.getCurNestStartIndex(data[2]) });
				} else if (listItem.i !== UNDEFINED && listItem.r !== UNDEFINED) {
					let theNest = this.invertNest.find(it => {
						return it.key === data[1].key;
					});
					if (theNest) {
						theNest.next[data[3]] = listItem.i;
					} else {
						this.invertNest.push({
							opType: UPDATE,
							key: data[1].key,
							parentKey: data[1].parentKey,
							prev: { ...data[1] },
							next: {
								...data[1],
								[data[3]]: listItem.i
							}
						});
					}
				} else if (listItem.i !== UNDEFINED) {
					if (listItem.i.ops) {
						this.invertDelta = this.invertDelta.concat(new Delta(listItem.i));
						this.flushInvertData();
						this.filterInvertNest(data[2]);
					} else {
						this.invertDelta = this.invertDelta.concat(this.cursiveFindDelta(listItem.i));
						this.pushToInvertNest({ ...listItem.i, opType: INSERT });
					}
				} else if (listItem.r !== UNDEFINED) {
					let startIndex = this.getCurNestStartIndex(data[0]);
					let length = this.getNestItemLength(data[0]);
					this.invertDelta = this.invertDelta.concat(new Delta().retain(startIndex).delete(length));
					this.pushToInvertNest({ ...data[0], opType: DELETE, startIndex });
				}
			}
		}, [item, itemParent, null, 0]);
	}

	cursiveFindDelta(item) {
		let tmpDelta = new Delta();
		Dfs(item, it => {
			let node = it.node;
			if (node.ops) {
				tmpDelta = tmpDelta.concat(new Delta(node));
			}
		});
		return tmpDelta;
	}

	transformDelta() {
		this.cursiveTransformDelta(this.data);
	}

	cursiveTransformDelta(data) {
		if (data._children) {
			data._children = data._children.reduce((a, it) => {
				this.cursiveTransformDelta(it);
				if (it.ops && new Delta(it).changeLength() === 0) {
					return a;
				}
				let aLen = a.length;
				if (aLen === 0) {
					a.push(it);
				} else if (a[aLen - 1].ops && it.ops) {
					a[aLen - 1] = new Delta(it).compose(new Delta(a[aLen - 1]));
				} else {
					a.push(it);
				}
				return a;
			}, []);
		}
	}

	getDeltaLength(jsonDelta) {
		return new Delta(jsonDelta).changeLength();
	}

	filterInsertKeys(insertNest) {
		const INVALID_KEYS = ["startIndex", "endIndex", "opType"];
		Dfs(insertNest, it => {
			if (!it.ops) {
				INVALID_KEYS.forEach(key => {
					if (it[key]) {
						delete it[key];
					}
				});
			}
		});
		return insertNest;
	}

	getCurDeltaStartIndex(parent, index) {
		let curNestStartIndex = this.getCurNestStartIndex(parent);
		parent._children.forEach((item, i) => {
			if (i < index) {
				curNestStartIndex += this.getNestItemLength(item);
			}
		});
		return curNestStartIndex;
	}

	getNestItemLength(nestItem) {
		let length = 0;
		Dfs(nestItem, item => {
			let node = item.node;
			if (node.ops) {
				length += this.getDeltaLength(node);
			}
		});
		return length;
	}

	getCurNestStartIndex(nestItem) {
		let length = 0;
		Dfs(this.data, item => {
			let node = item.node;
			if (node.ops) {
				length += this.getDeltaLength(node);
			} else if (node.key === nestItem.key) {
				return false;
			}
		});
		return length;
	}


	seperate() {
		let tmpDelta = new Delta();
		let nest = cloneDeep(this.data);
		let length = 0;
		Dfs(nest, (it) => {
			let item = it.node;
			if (item.ops) {
				let curDelta = new Delta(item);
				tmpDelta = tmpDelta.concat(curDelta);
				length += curDelta.length();
			} else {
				if(item.opType) {
					delete item.opType;
				}
				item.startIndex = length;
			}
		}, (it) => {
			let item = it.node;
			if (!item.ops) {
				item.endIndex = length;
				item._children = item._children.filter(data => !data.ops);
			}
		});

		return [tmpDelta, nest];
	}
}

function Dfs(node, forwardCallback, backCallback) {
	let stack = [new ItemNode(node, null, null)];
	while (stack[stack.length - 1]) {
		let itemNode = stack[stack.length - 1];
		if (itemNode.visited) {
			let pendingItem = stack.pop();
			if (isFunction(backCallback) && backCallback(pendingItem) === false) break;
		} else {
			if (isFunction(forwardCallback) && forwardCallback(itemNode) === false) break;
			itemNode.visited = true;
			let node = itemNode.node;
			if (Array.isArray(node._children) && node._children.length > 0) {
				for (let i = node._children.length - 1; i >= 0; i--) {
					stack.push(new ItemNode(node._children[i], node, i));
				}
			}
		}
	}
}

class ItemNode {
	visited = false;
	node;
	index;
	parentNode;

	constructor(node, parentNode, index) {
		this.node = node;
		this.parentNode = parentNode;
		this.index = index;
	}
}