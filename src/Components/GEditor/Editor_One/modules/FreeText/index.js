import Quill from "quill";
import { addDraggable, addMouseMove } from "../../common";

const Container = Quill.import("blots/outerContainer");
const Module = Quill.import('core/module');
const Delta = Quill.import('delta');

/**
 * 1. move freely in a page
 * 2. resize
 * 3. only text
 */

class FreeText extends Container {

	width
	height
	left
	top

	static create(value) {
		let domNode = super.create(value);

		const styleArr = [
			`position: absolute;`,
			`left: ${value.containerleft || 0}px;`,
			`top: ${value.containertop || 0}px;`,
			`width: ${(+value.containerwidth || 100)}px;`,
			`height: ${(+value.containerheight || 100)}px;`,
		];
		domNode.setAttribute('style', styleArr.reduce((a, b) => a + ` ${b}`));
		return domNode;
	}

	constructor(scroll, domNode, value) {
		super(scroll, domNode, value);	
		addMouseMove(domNode);
		domNode.addEventListener('click', (e) => {
			e = e || window.event;

			let rectObj = this.domNode.getBoundingClientRect();
			let rightSpace = rectObj.left + this.domNode.clientWidth - e.clientX;
			let bottomSpace = rectObj.top + this.domNode.clientHeight - e.clientY;
			if(!(rightSpace > 20 && rightSpace <= 40 && bottomSpace >= 0 && bottomSpace <= 20)) return;
			this.remove();
		});
	}

	// checkMerge() {
	// 	return false;
	// }

	addFocusedChange() {
		this.scroll.focusedContainer = this;
		if(this.statics.blotName === 'page-container') return;
		this.domNode.classList.add('ql-free-text-focused');
	}

	removeFocusedChange() {
		this.domNode.classList.remove('ql-free-text-focused');
	}

	optimize(context){
		super.optimize(context);
		let curWidth = this.domNode.offsetWidth;
		let curHeight = this.domNode.offsetHeight;

		let curLeft = this.domNode.offsetLeft;
		let curTop = this.domNode.offsetTop;

		if(this.width !== curWidth || this.height !== curHeight) {
			this.width = curWidth;
			this.height = curHeight;
			this.attachAttrsToFlag({containerwidth: curWidth, containerheight: curHeight});
		}

		if(this.left !== curLeft || this.top !== curTop) {
			this.left = curLeft;
			this.top = curTop;
			this.attachAttrsToFlag({containerleft: curLeft, containertop: curTop});
		}

		let firstChild = this.children.head;
		if(firstChild && firstChild.next && !firstChild.next.domNode.getAttribute('style')) {
			firstChild.next.domNode.setAttribute('style', 'position: relative;');
		}
	}
}

FreeText.blotName = 'free-text';
FreeText.tagName = 'DIV';
FreeText.className = 'ql-free-text';

export default class FreeTextModule extends Module {

	static register() {
		Quill.register(FreeText);
	}

	constructor(quill, options) {
		super(quill, options);
	}

	insert({index}) {
		const quill = this.quill;	
		const range = quill.getSelection();
		if(!index && !range) return;
		index = range.index || index;
    let currentBlot = quill.getLeaf(index)[0]
		if(this.isInFreeText(currentBlot)) return;

		let layoutDelta = new Delta()
			.retain(index)
			.insert({'container-flag': {container: FreeText.blotName} });

		console.log("====>>>>>>freetextindex", index, range, layoutDelta);
		quill.updateContents(
			layoutDelta,
			Quill.sources.USER
		);
		const [line, offset] = quill.getLine(index);
		// line.parent.addFocusedChange();
	}

	isInFreeText(current) {
		return current && current.parent
			? current.parent instanceof FreeText
				? true
				: this.isInFreeText(current.parent)
			: false
		}
}