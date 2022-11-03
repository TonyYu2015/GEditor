import Quill from "quill";
import { addResizeMove } from "../../common";

const Block = Quill.import('blots/block');
const Container = Quill.import('blots/container');

export default class Resize extends Container {
	static create(value) {
		let domNode = super.create(value);

		const styleArr = [
			`position: absolute;`,
			`top: 0;`,
			`left: ${value.width}%;`,
			`height: 100%;`,
			`width: 2px;`,
			// `background-color: red;`,
			`cursor: col-resize;`,
		];
		domNode.setAttribute('style', styleArr.reduce((a, b) => a + ` ${b}`));
		return domNode;
	}

	constructor(scroll, domNode, value) {
		super(scroll, domNode, value);
		addResizeMove(domNode);
	}

	optimize(context) {
		let left = this.domNode.style.left;
		if(~left.indexOf('px')) {
			let percent = this.transferPxToPercent(left);
			let firstContainer = this.parent.children.head;
			let secondContainer = this.parent.children.head.next;
			firstContainer.domNode.style.width = `${percent}%`;
			secondContainer.domNode.style.width = `${100 - percent}%`;
			this.domNode.style.left = `${percent}%`;
		}
	}

	transferPxToPercent(px) {
		let parentWidth = parseInt(this.parent.domNode.clientWidth);
		let curDomNodeWidth = parseInt(px);
		return Math.floor((curDomNodeWidth / parentWidth) * 100);
	}
}

Resize.blotName = 'layout-resize';
Resize.tagName = 'DIV';
Resize.className = 'ql-layout-resize';