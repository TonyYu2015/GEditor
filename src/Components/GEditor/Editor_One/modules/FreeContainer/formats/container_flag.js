import Quill from "quill";
import ContainerWrapper from "./container_wrapper";
import { getContainer } from "..";

const Block = Quill.import('blots/block');
const Container = Quill.import('blots/container');

export default class ContainerFlag extends Block {

	static create(value) {
		const node = super.create(value);
		node.setAttribute("style", "display: none;");
		return node;
	}

	nested = true;

	constructor(scroll, domNode, value) {
		super(scroll, domNode, value);
		this._value = value;
		this.prevlength = 1;
		this.childlength = +value.childlength || 1;
		this.key = value.key || genId();
		this.level = value.level;
		this.quill = Quill.find(scroll.domNode.parentNode);
	}

	formats() {
		return {
			[this.statics.blotName]: {
				...this._value,
				childlength: this.childlength,
				key: this.key,
				level: this.level,
			}
		}
	}

	updateLength(len) {
		this.cache = {};
		if (this.prevlength === this.childlength) {
			this.childlength = len;
		}
		this.prevlength = len;
	}

	updatePrevLength(len) {
		this.prevlength = len;
	}

	optimize(context) {
		const history = this.quill.getModule('history');
		if (
			this.key === this.parent.key
			&& this.prevlength == this.childlength
			&& history.ignoreChange
		) {
			let tmpChildlength = this.childlength;
			this.parent.calChildrenLen();
			this.childlength = tmpChildlength;
		}

		if (
			this.level !== undefined
			&& this.parent.statics.blotName !== 'scroll'
			&& this.parent.key !== this.key
		) {
			let targetContainer = getContainer(this);
			let prevContainer = targetContainer;
			while (targetContainer.level > this.level) {
				prevContainer = targetContainer;
				targetContainer = getContainer(targetContainer);
			}

			if (targetContainer.level === this.level && !this.nested) {
				prevContainer = targetContainer;
				targetContainer = getContainer(targetContainer);
			}
			if (prevContainer !== targetContainer) {
				this.batchMoveOut(targetContainer, prevContainer);
			}

		}

		if (this.level === undefined) {
			this.findTheNearestFlagAndUpdateLevel();
		}
		if (
			this.statics.requiredContainer &&
			!(this.parent instanceof this.statics.requiredContainer)
		) {
			this.wrap(this.statics.requiredContainer.blotName, { ...this._value, key: this.key, level: this.level });
			if (this.childlength == 1 && !this.next) {
				const blot = this.scroll.create('block');
				this.parent.appendChild(blot);
			}
		}
		super.optimize(context);
		if (this.prev !== null) {
			this.movePrevOut();
		}
		this.updateChildren();
	}

	movePrevOut() {
		while (this.prev) {
			this.parent.parent.insertBefore(this.prev, this.parent || undefined);
		}
	}

	updateChildren() {
		while (this.prevlength < this.childlength) {
			let pendingPrev = this.parent;
			let pendingNext = pendingPrev.next;
			while(!pendingNext && pendingPrev && pendingPrev.parent) {
				pendingPrev = pendingPrev.parent;
				pendingNext = pendingPrev.next;
			}
			this.parent.appendChild(pendingNext);
			if (pendingNext instanceof Container) {
				this.prevlength += this.getChildrenCount(this.parent.next);
			} else if (pendingNext instanceof ContainerWrapper) {
				this.prevlength += pendingNext.children.head.childlength;
			} else {
				this.prevlength++;
			}
		}
	}

	getChildrenCount(container, count = 0) {
		container.children.forEach(blot => {
			if (blot instanceof ContainerWrapper) {
				count += blot.children.head.childlength;
			} else if (blot instanceof Container) {
				count += this.getChildrenCount(blot, count);
			} else {
				count++;
			}
		});
		return count;
	}

	isInSameTypeContainer() {
		const container = getContainer(this);
		return [container instanceof this.statics.requiredContainer, container];
	}

	batchMoveOut(targetContainer, prevContainer) {
		let needMoveOutBlot = this;
		while (
			prevContainer.statics.requiredContainer
			&& prevContainer.parent instanceof prevContainer.statics.requiredContainer
		) {
			prevContainer = prevContainer.parent;
		}
		let containerNext = prevContainer.next;
		/** TODO:是否可以直接遍历到最后一个还是需要根据容器的childlength来遍历 */
		while (needMoveOutBlot) {
			let tmpBlot = needMoveOutBlot;
			needMoveOutBlot = needMoveOutBlot.next;
			targetContainer.insertBefore(tmpBlot, containerNext);
		}
	}

	findTheNearestFlagAndUpdateLevel() {
		let theFlag = this.findTheclosetFlag(this.parent);
		if (theFlag) {
			let parentLevel = theFlag.level;
			this.level = parentLevel + 1;
		} else {
			this.level = 0;
		}
	}

	findTheclosetFlag(containerBlot) {
		let flagContainer = containerBlot;
		if (flagContainer) {
			if (flagContainer instanceof ContainerWrapper) {
				return flagContainer.children.head;
			} else {
				this.findTheclosetFlag(flagContainer.parent);
			}
		}
		return null;
	}

	deleteAt(index, length) {
		super.deleteAt(index, length);
		this.parent.unwrap();
	}

	replaceWith(...args) {
		let rep = super.replaceWith(...args);
		if (rep instanceof ContainerFlag) {
			if (rep.key !== this.key) {
				rep.parent.unwrap()
			} else {
				rep.updatePrevLength(this.childlength);
			}
		} else {
			rep.parent.unwrap();
		}
		return rep;
	}
}

ContainerFlag.blotName = "container-flag";
ContainerFlag.tagName = "P";
ContainerFlag.className = `ql-container-flag`;


function genId() {
	return `${Math.random().toString(32).slice(2, 8)}`;
}