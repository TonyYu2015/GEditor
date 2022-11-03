import Quill from "quill";
import { editSize } from "../../common";

const Container = Quill.import("blots/outerContainer");
const Module = Quill.import('core/module');
const Delta = Quill.import('delta');

class FullWidthWrapper extends Container {
	static create(value) {
		let domNode = super.create(value);
		domNode.setAttribute('style', `width: ${editSize.width}px; min-height: 100px; position: relative;`);
		return domNode;
	}

	constructor(scroll, domNode, value) {
		super(scroll, domNode, value);
		const quill = Quill.find(this.scroll.domNode.parentNode);
		let pageBreak = quill.getModule('pageBreak');
		domNode.style.marginLeft = `-${pageBreak.constructor.pagePadding[3]}px`;
	}

	optimize(context) {
		super.optimize(context);
		let firstChild = this.children.head;
		if(firstChild && firstChild.next && !firstChild.next.domNode.getAttribute('style')) {
			firstChild.next.domNode.setAttribute('style', 'position: relative;');
		}
	}
}

FullWidthWrapper.blotName = 'full-width-wrapper';
FullWidthWrapper.tagName = 'DIV';
FullWidthWrapper.className = 'ql-full-width-wrapper';


export default class FullWidthModule extends Module {

	static register() {
		Quill.register(FullWidthWrapper);
	}

	constructor(quill, options) {
		super(quill, options);
	}

	insert({index}) {
		const quill = this.quill;	
		const range = quill.getSelection();
		if(!index && !range) return;
		index = index || range.index;
    let currentBlot = quill.getLeaf(index)[0]
		if(this.isInFullWidthWrapper(currentBlot)) return;


		let layoutDelta = new Delta()
			.retain(index)
			.insert({'container-flag': {container: FullWidthWrapper.blotName} });

		quill.updateContents(
			layoutDelta,
			Quill.sources.USER
		);
		const [line, offset] = quill.getLine(index);
		// line.parent.addFocusedChange();
	}

	isInFullWidthWrapper(current) {
		return current && current.parent
			? current.parent instanceof FullWidthWrapper
				? true
				: this.isInFullWidthWrapper(current.parent)
			: false
		}
}