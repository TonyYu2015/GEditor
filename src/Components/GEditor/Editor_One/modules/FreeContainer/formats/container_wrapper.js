import Quill from "quill";
import ContainerFlag from "./container_flag";

const Container = Quill.import('blots/container');
const Block = Quill.import('blots/block');
const BlockEmbed = Quill.import('blots/block/embed');

export default class ContainerWrapper extends Container {

	static allowedChildren = [Block, BlockEmbed, Container]

	constructor(scroll, domNode, value = {}) {
		super(scroll, domNode, value);
		Object.entries(value).forEach(item => {
			this[item[0]] = item[1];
		})
	}

	checkMerge() {
		return super.checkMerge() && this.key === this.next.key;
	}

	optimize(context) {
		super.optimize(context);
		const flagBlot = this.children.head;
		if (flagBlot instanceof ContainerFlag) {
			this.len = 0;
			this.calLen(this);
			flagBlot.updateLength(this.len);
		}
	}

	calLen(containerBlot) {
		containerBlot.children.forEach(blot => {
			if (blot instanceof ContainerWrapper) {
				this.len += blot.children.head.childlength;
			} else if (blot instanceof Container) {
				this.calLen(blot);
			} else {
				this.len++;
			}
		})
	}

	attachAttrsToFlag(attrs) {
		if (typeof attrs !== "object") {
			throw new Error('the attrs argument should be an object!');
		}
		const flagBlot = this.children.head;
		if (flagBlot && flagBlot instanceof ContainerFlag) {
			Object.entries(attrs).forEach(item => {
				flagBlot._value[item[0]] = item[1];
			})
		}
	}

}