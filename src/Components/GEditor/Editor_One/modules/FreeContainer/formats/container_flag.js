import Quill from "quill";
import ContainerWrapper from "./container_wrapper";

const BlockEmbed = Quill.import('blots/block/embed');

export default class ContainerFlag extends BlockEmbed {
	constructor(scroll, domNode, value) {
		super(scroll, domNode, value);
		this._value = value;
		this.prevlength = 1;
		this.childlength = value.childlength || 1;
		this.key = value.key || genId();
		this.level = value.level;
		this.quill = Quill.find(scroll.domNode.parentNode);
	}

	value() {
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
		if (this.prevlength === this.childlength) {
			this.childlength = len;
		}
		this.prevlength = len;
	}

	updatePrevLength(len) {
		this.prevlength = len;
	}

	optimize(context) {
		if(!this.level) {
			this.findTheNearestFlagAndUpdateLevel();
		}
		if (
			this.statics.requiredContainer &&
			!(this.parent instanceof this.statics.requiredContainer)
		) {
			this.wrap(this.statics.requiredContainer.blotName, { ...this._value, key: this.key, level: this.level });
			if (this.childlength === 1 && !this.next) {
				const blot = this.scroll.create('block');
				this.parent.appendChild(blot);
			}
		}
		super.optimize(context);
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
		let flagContainer = containerBlot.parent;
		if (flagContainer) {
			if (flagContainer instanceof ContainerWrapper) {
				return flagContainer.children.head;
			} else {
				this.findTheclosetFlag(flagContainer);
			}
		}
		return null;
	}

	replaceWith(...args) {
		let rep = super.replaceWith(...args);
		if (rep.statics.blotName === 'block') {
			rep.parent.unwrap();
		} else if (rep instanceof ContainerFlag) {
			rep.updatePrevLength(this.childlength);
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