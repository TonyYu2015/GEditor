import Quill from "./register";
import { genId } from "./common";
import pageContainer from "./modules/PageBreak/blots/pageContainer";
import ContainerWrapper from "./modules/FreeContainer/blots/containerWrapper";
import { CMD_TYPES, OP_TYPES, SCROLL_CHILDREN } from "./consts";

const Container = Quill.import('blots/container');
const Delta = Quill.import('delta');


export default class NestContainerManager {
	NestContainer;

	constructor(quill) {
		this.quill = quill;
		this.cacheNests = [];
		this._retain = -1;
		quill.emitter.on("structure-operation", (operation, delta, nest) => {
			this.NestContainer = nest;

			if (!operation) {
				return;
			}
			let changeDelta;
			if (operation?.length > 0 && operation[0]) {
				changeDelta = new Delta(operation[0]);
			}

			if (operation?.length > 1 && operation[1]) {
				this.cacheNests = operation[1];
			}

			quill.cmdType = CMD_TYPES.SYNC;

			for (let obj of this.cacheNests) {
				if (obj.opType === OP_TYPES.UPDATE) {
					this.applyNestAttrs(obj.next);
				}
			}

			if (changeDelta?.ops?.length > 0) {
				quill.updateContents(changeDelta, Quill.sources.USER);
			}

			quill.cmdType = null;
		});
	}



	initial(data) {
		if (!data) {
			this.NestContainer = {
				_children: [
					{
						startIndex: 0,
						endIndex: 1,
						key: genId(pageContainer.blotName),
						blotName: pageContainer.blotName,
						_children: [],
						padding_top: 90,
						padding_right: 60,
						padding_bottom: 90,
						padding_left: 60,
					}
				]
			}
		} else {
			this.NestContainer = data;
		}
	}

	clearCacheNests = () => {
		this.cacheNests = [];
	}

	getCacheNestByKey = (key) => {
		if (this.cacheNests?.length > 0) {
			for (let data of this.cacheNests) {
				if (data.key === key) {
					return data;
				}
			}
		}
		return null;
	}

	appendCacheNest = (nest) => {
		let exist = false;
		// 如果存在删除或插入操作，不添加，否则替换
		for (let i = this.cacheNests.length - 1; i > -1; i--) {
			let data = this.cacheNests[i];
			if (data.key === nest.key) {
				if (data.opType === OP_TYPES.INSERT || data.opType === OP_TYPES.DELETE) {
					exist = true;
					break;
				} else {
					this.cacheNests.splice(i, 1);
				}
			}
		}

		if (!exist) {
			this.cacheNests.push(nest);
		}
	}

	getCacheNests = (isClone = false) => {
		if (isClone) {
			return [...this.cacheNests];
		}
		return this.cacheNests;
	}

	getStartIndex(blot) {
		return this.quill.getIndex(blot);
	}

	getEndIndex(blot) {
		return this.quill.getIndex(blot) + blot.length();
	}

	findParentBlot(index, blot, container = this.NestContainer._children) {
		let tmpContainer = container.find(container => {
			return index < container.endIndex && index >= container.startIndex;
		});
		if (
			tmpContainer &&
			(
				tmpContainer.key === blot._value?.key
				|| (
					blot instanceof Container
					&& !(blot instanceof ContainerWrapper)
					&& blot.statics.allowedChildren.find(blotConstructor => blotConstructor.blotName === tmpContainer.blotName)
				)
			)
		) {
			return null;
		}
		if (tmpContainer?._children?.length > 0) {
			let childContainer = this.findParentBlot(index, blot, tmpContainer._children);
			tmpContainer = childContainer ? childContainer : tmpContainer;
		}

		return tmpContainer;
	}

	filterDisableData(obj) {
		let tmpObj = {};
		Object.entries(obj).forEach(item => {
			if (typeof item[1] !== 'object' || Array.isArray(item[1])) {
				tmpObj[item[0]] = item[1];
			}
		});
		return tmpObj;
	}

	/**
	* @description 通过index获得嵌套数据
	* @param isClone 是否返回浅克隆数据
	* @return data
	*/
	getNestDataByRange = (range, isClone = false) => {
		let result = [];
		this.doGetNestData(range, this.NestContainer, result, false);

		let data = null;
		if (result.length > 0) {
			data = result[result.length - 1];
		}
		if (isClone) {
			return { ...data }
		}
		return data;
	}

	/**
	* @description 通过key获得嵌套数据
	* @param isClone 是否返回浅克隆数据
	* @return data
	*/
	getNestDataByKey = (key, isClone = false) => {
		let result = [];
		this.doGetNestData(key, this.NestContainer, result, true);

		let data = result.length > 0 ? result[0] : null;
		if (isClone) {
			return { ...data }
		}
		return data;
	}

	doGetNestData = (value, containter, result, isKey = true) => {
		if (containter?._children?.length > 0) {
		}
		else {
			return;
		}

		for (let nest of containter._children) {
			if (isKey) {
				if (result.length > 0) {
					return;
				}
				if (nest.key === value) {
					result.push(nest);
					return;
				}
			} else {

				let len = nest.endIndex - value.startIndex;
				if (nest.startIndex <= value.startIndex
					&& value.startIndex < value.endIndex
					&& len > 0
					&& len <= (nest.endIndex - nest.startIndex)) {
					result.push(nest);
				}
			}

			this.doGetNestData(value, nest, result, isKey);
		}
	}

	/**
	* @description 更新嵌套容器索引
	* @param len 影响长度（添加后更新为正，移除后更新为负值)
	* @ignoreKeys 忽略刷新列表
	* @return 
	*/
	updateNestIndexByData = (nestData, retain, len, ignoreKeys) => {
		if (!nestData) {
			return;
		}
		let parentNest;
		parentNest = this.getNestDataByKey(nestData.parentKey);
		while (parentNest) {
			parentNest.endIndex += len;
			parentNest = this.getNestDataByKey(parentNest.parentKey);
		}
		this.doUpdateIndexByData(this.NestContainer, retain, len, ignoreKeys);
	}

	doUpdateIndexByData = (containter, retain, len, ignoreKeys) => {
		if (containter?._children?.length > 0) {
		}
		else {
			return;
		}

		for (let nest of containter._children) {

			let ignore = false;
			if (ignoreKeys?.length > 0) {
				if (ignoreKeys.includes(nest.key)) {
					ignore = true;
				}
			}

			if (!ignore) {
				if (nest.startIndex > retain) {
					nest.startIndex += len;
					nest.endIndex += len;
				}
				if (nest.startIndex < 0) {
					console.log("index error");
				}
				this.doUpdateIndexByData(nest, retain, len, ignoreKeys);
			}

		}

		containter._children.sort((a, b) => {
			return a.startIndex - b.startIndex;
		});
	}

	updateNestsIndexByBlot = () => {
		this.NestContainer.startIndex = 0;
		this.NestContainer.endIndex = this.getEndIndex(this.quill.scroll);
		this.doUpdateNestIndexByBlot(this.quill.scroll, 0);
	}

	doUpdateNestIndexByBlot = (container, retain) => {
		container.children.forEach(blot => {
			let start = this.getStartIndex(blot);
			if (start >= retain) {
			} else {
				return;
			}
			if (blot instanceof Container) {
				if (blot instanceof ContainerWrapper) {
					this.doResetIndex(blot);
				}
				this.doUpdateNestIndexByBlot(blot, retain);
			}
		})
	}

	doResetIndex = (blot) => {
		if (blot?._value?.key) {
		} else {
			return;
		}
		let data = this.getNestDataByKey(blot._value.key);
		if (data) {
			let prevStartIndex = data.startIndex;
			let prevEndIndex = data.endIndex;
			let nextStartIndex = this.getStartIndex(blot);
			let nextEndIndex = this.getEndIndex(blot);
			if (prevStartIndex === nextStartIndex && prevEndIndex === nextEndIndex) {
			} else {
				data.startIndex = nextStartIndex;
				data.endIndex = nextEndIndex;
			}
		}
	}

	getChildrenNestDatas = (nestData) => {
		let result = [];
		this.doGetChildrenNestDatas(nestData, result);
		return result;
	}

	doGetChildrenNestDatas = (containter, result) => {
		if (containter?._children?.length > 0) {
		}
		else {
			return;
		}

		for (let nest of containter._children) {
			result.push(nest);
			this.doGetChildrenNestDatas(nest, result);
		}
	}


	/**
	* @description 添加嵌套容器数据
	* @param isAddHistory 是否加入历史记录，用于撤销回退，默认false
	* @param isUpdateIndex 是否刷新索引,默认true
	* @return void
	*/
	addNestData = (data, isAddHistory = false, isUpdateindex = false) => {
		let parent;
		if (SCROLL_CHILDREN.includes(data.blotName)) {
			parent = this.NestContainer;
		} else {
			parent = this.getNestDataByKey(data.parentKey);
			if (!parent) {
				console.log("父容器不存在");
				return;
			}
		}

		delete data.opType;
		if (isAddHistory) {
			let nestData = { ...data };
			nestData.opType = OP_TYPES.INSERT;
			this.appendCacheNest(nestData);
		}

		parent._children.push(data);

		if (isUpdateindex) {
			this.updateNestIndexByData(data, data.startIndex, data.endIndex - data.startIndex);
		}
		parent._children.sort((a, b) => {
			return a.startIndex - b.startIndex;
		});
	}

	/**
	* @description 移除嵌套容器数据
	* @param isAddHistory
	* @param isUpdateIndex
	* @param key
	* @return 
	*/
	removeNestDataByKey = (key, isAddHistory = false, isUpdateindex = false) => {
		if (!key) {
			return;
		}
		let nestData = this.getNestDataByKey(key);
		if (!nestData) {
			return;
		}
		if (isAddHistory) {
			let data = { ...nestData }
			data.opType = OP_TYPES.DELETE;
			this.appendCacheNest(data);
		}

		this.doRemoveNestData(key, this.NestContainer._children);

		if (isUpdateindex) {
			this.updateNestIndexByData(nestData, nestData.endIndex, nestData.endIndex - nestData.startIndex);
		}
	}

	doRemoveNestData = (key, children) => {
		if (children?.length > 0) {
		}
		else {
			return;
		}

		for (let i = 0; i < children.length; i++) {
			let container = children[i];
			if (container.key === key) {
				children.splice(i, 1);
				return;
			} else {
				this.doRemoveNestData(key, container._children);
			}
		}
	}

	/**
	* @description 通过容器blot添加嵌套数据
	* @param 
	* @return 
	*/
	addNestDataByBlot(blot, isAddHistory = true, isUpdateindex = false) {
		let data = this.getNestDataFromBlot(blot);
		this.addNestData(data, isAddHistory, isUpdateindex);
		return data;
	}

	/**
	* @description 通过blot获得嵌套容器数据
	* @param 
	* @return 
	*/
	getNestDataFromBlot(blot) {
		if (blot && blot._value) {
		} else {
			return null;
		}

		const _value = this.filterDisableData(blot._value);
		let obj = {
			..._value,
			startIndex: this.getStartIndex(blot),
			endIndex: this.getEndIndex(blot),
			blotName: blot.statics.blotName,
			_children: this.getChildrenNestDatasByBlot(blot)._children
		}

		if (blot.getContainer(blot)?._value?.key) {
			obj.parentKey = blot.getContainer(blot)._value.key;
		}

		return obj;
	}

	/**
	* @description 获取容器内所有嵌套数据
	* @param 
	* @return 
	*/
	getChildrenNestDatasByBlot(container) {
		let _children = [];
		this.doGetChildrenNestDatasByBlot(container, _children);
		return { _children, startIndex: this.getStartIndex(container), endIndex: this.getEndIndex(container) };
	}

	doGetChildrenNestDatasByBlot(blot, containerChildren) {
		blot.children.forEach(blot => {
			if (blot instanceof Container) {
				if (blot instanceof ContainerWrapper) {
					const _value = this.filterDisableData(blot._value);
					let obj = {
						..._value,
						startIndex: this.getStartIndex(blot),
						endIndex: this.getEndIndex(blot),
						blotName: blot.statics.blotName,
						_children: []
					}
					if (blot.getContainer(blot)?._value?.key) {
						obj.parentKey = blot.getContainer(blot)._value.key;
					}
					this.doGetChildrenNestDatasByBlot(blot, obj._children);
					containerChildren.push(obj);
				} else {
					this.doGetChildrenNestDatasByBlot(blot, containerChildren);
				}
			}
		})
	}

	/**
	* @description 通过key获取容器Blot
	* @param key
	* @return 
	*/
	getNestBlotByKey = (key) => {
		let result = this.doGetNestBlot(key, this.quill.scroll);
		return result;
	}

	doGetNestBlot = (key, containter) => {
		let result = null
		containter?.children?.forEach((blot) => {
			if (blot instanceof Container) {
				if (blot._value?.key === key) {
					result = blot;
				}
			}
			if (!result) {
				result = this.doGetNestBlot(key, blot);
			}

		})
		return result;
	}


	applyNestAttrs = (value) => {
		if (value?.key) {
		} else {
			return;
		}
		let nestData = this.getNestDataByKey(value.key);
		if (!nestData) {
			return;
		}
		let blot = this.getNestBlotByKey(value.key);
		if (blot?._value) {
		} else {
			return;
		}
		Object.entries(value).forEach(item => {
			blot._value[item[0]] = item[1];
			nestData[item[0]] = item[1];
		})

		blot.optimize();

	}

	getIndexes = (isIncludeCache = false) => {
		let result = [];
		this.doGetIndexes(this.NestContainer, result);

		if (isIncludeCache) {
			for (let nest of this.cacheNests) {
				if (nest.opType === OP_TYPES.DELETE) {
					result.push({ key: nest.key, startIndex: nest.startIndex, endIndex: nest.endIndex });
					// this.doGetIndexes(nest, result);
				}

			}
		}

		result.push({ "key": "scroll", "startIndex": this.NestContainer.startIndex, "endIndex": this.NestContainer.endIndex });

		return result;
	}

	doGetIndexes = (nestData, result) => {
		nestData?._children?.forEach(child => {
			if (child) {
				result.push({ key: child.key, startIndex: child.startIndex, endIndex: child.endIndex });
				this.doGetIndexes(child, result);
			}
		})
	}

	applyIndexes = (indexes) => {
		if (indexes?.length > 0) {
		}
		else {
			return;
		}

		let scrollData = indexes.find(value => {
			if (value.key === "scroll") {
				return true;
			}
		});

		if (scrollData) {
			let prevStartIndex = this.NestContainer.startIndex;
			let prevEndIndex = this.NestContainer.endIndex;
			this.NestContainer.startIndex = scrollData.startIndex;
			this.NestContainer.endIndex = scrollData.endIndex;
		}
		indexes.forEach(value => {
			let key = value.key;
			let data = this.getNestDataByKey(key);
			if (data) {
				let prevStartIndex = data.startIndex;
				let prevEndIndex = data.endIndex;
				if (prevStartIndex === value.startIndex && prevEndIndex === value.endIndex) {
				} else {
					data.startIndex = value.startIndex;
					data.endIndex = value.endIndex;

					if (data.parentKey) {
						let parentData = this.getNestDataByKey(data.parentKey);
						if (parentData) {
							parentData._children.sort((a, b) => {
								return a.startIndex - b.startIndex;
							});
						}
					}

				}
			}
		})
	}

	get retain() {
		return this._retain;
	}

	setRetain(index, msg) {
		this._retain = index;
	}

}
