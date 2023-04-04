import Quill from "quill";
import { Range } from "quill/core/selection";
import { editSize, getEventComposedPath } from "../../common";
import LayoutContextMenu from "../../components/ContextMenu";
import { createInsertDelta } from "../../utility";
import { ContainerWrapper } from "../FreeContainer";

const Module = Quill.import('core/module');
const Delta = Quill.import('delta');

class FullWidthWrapper extends ContainerWrapper {
	static create(value) {
		let domNode = super.create(value);
		domNode.setAttribute('style', `width: ${editSize.width}px; min-height: 100px; position: relative;`);
		return domNode;
	}

	constructor(scroll, domNode, value) {
		super(scroll, domNode, value);
		this.autoAddNextBlock = false;
		this.quill = Quill.find(this.scroll.domNode.parentNode);
		let pageBreak = this.quill.getModule('pageBreak');
		domNode.style.marginLeft = `-${pageBreak.PagePaddingManager.padding_left}px`;

		domNode.addEventListener("contextmenu", (e) => {
			let _this = this;
			e.preventDefault();
			e.stopPropagation();
			let path = getEventComposedPath(e);
			if (!path || path.length <= 0) return;
			new LayoutContextMenu({
				left: e.pageX,
				top: e.pageY
			}, this.quill, [
				{
					text: "remove",
					clickEvt: (evt) => {
						evt.preventDefault();
						this.remove();
					}
				}
			]);
		}, false);
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

	insert({ index }) {
		const quill = this.quill;
		const range = quill.getSelection();
		index = range ? range.index : index;
		if (index === -1) {
			return;
		}

		let currentBlot = quill.getLeaf(index)[0]
		if (this.isInFullWidthWrapper(currentBlot))
			return;

		let layoutDelta = createInsertDelta(quill, index).insert({ 'block': { container: FullWidthWrapper.blotName } });

		quill.updateContents(
			layoutDelta,
			Quill.sources.USER
		);
	}

	isInFullWidthWrapper(current) {
		return current && current.parent
			? current.parent instanceof FullWidthWrapper
				? true
				: this.isInFullWidthWrapper(current.parent)
			: false
	}
}