import Quill from "quill";
import Resize from './resize';
import { genId, getEventComposedPath } from "../../common";
import LayoutContextMenu from "../../components/ContextMenu";
import ContainerWrapper from '../FreeContainer/blots/containerWrapper';
import { createInsertDelta } from "../../utility";

const Module = Quill.import('core/module');

class LayoutOuterContainer extends ContainerWrapper {
	static create(value) {
		const domNode = super.create(value);
		domNode.setAttribute('style', 'width: 100%; display: flex;');
		return domNode;
	}

	constructor(scroll, domNode, value) {
		super(scroll, domNode, value);
		const quill = Quill.find(scroll.domNode.parentNode);
		// domNode.addEventListener('click', (evt) => {
		// 	if (evt.target === this.domNode) {
		// 		this.remove();
		// 	}
		// });

		domNode.addEventListener('mouseenter', (e) => {
			let width = this.children.head.domNode.style.width;
			let resize = this.scroll.create('layout-resize', { width: parseInt(width) || 0 });
			this.appendChild(resize);
		});

		domNode.addEventListener('mouseleave', (e) => {
			if (this.children.tail.statics.blotName === 'layout-resize') {
				this.children.tail.remove();
			}
		});

		domNode.addEventListener("contextmenu", (e) => {
			e.preventDefault();
			let path = getEventComposedPath(e);
			if (!path || path.length <= 0) return;
			// let layouterNode = path.filter(node => {
			// 	return node.tagName && node.classList.contains("ql-layout-outer");
			// });

			new LayoutContextMenu({
				left: e.pageX,
				top: e.pageY
			}, quill, [
				{
					text: "remove",
					clickEvt: (evt) => {
						this.remove();
						if (this.parent.children.length === 0) {
							const blot = this.scroll.create('block');
							blot.wrap(this.parent);
						}
					}
				}
			]);
		}, false);
	}
}

LayoutOuterContainer.blotName = "layout-outer";
LayoutOuterContainer.tagName = "DIV";
LayoutOuterContainer.className = "ql-layout-outer";

export class LayoutContainer extends ContainerWrapper {
	static create(value) {
		const domNode = super.create(value);
		const styleArr = [
			value.flex ? `flex: ${value.flex};` : `width: ${value.width}%;`,
			`display: inline-block;`,
			`vertical-align: top;`,
			`word-break: break-all;`,
			`position: relative;`,
		];
		domNode.setAttribute('style', styleArr.reduce((a, b) => a + ` ${b}`));
		return domNode;
	}

	optimize(context) {
		super.optimize(context);
		let width = parseInt(this.domNode.style.width) || 0;
		if (this.width !== width && this.children.head) {
			this.width = width;
			this.attachAttrsToFlag({ width });
		}
	}

}

LayoutContainer.blotName = "layout-container";
LayoutContainer.tagName = "DIV";
LayoutContainer.className = "ql-layout-container";

LayoutOuterContainer.allowedChildren = [LayoutContainer, Resize];

export default class Layout extends Module {

	static register() {
		Quill.register(LayoutOuterContainer);
		Quill.register(LayoutContainer);
		Quill.register(Resize);
	}

	constructor(quill, options) {
		super(quill, options);
	}

	insertLayout({ span, index }) {
		const quill = this.quill;
		const range = quill.getSelection();
		index = range ? range.index : index;
		if (index === -1) {
			return;
		}

		let columnsInfo = span.split("-");
		let columns = +columnsInfo[0];
		let width = Math.floor(100 / columns);

		let currentBlot = quill.getLeaf(index)[0];
		if (this.isInLayout(currentBlot)) return;

		// let layoutDelta = new Delta()
		// 	.retain(index);

		// let [lineBlot] = quill.getLine(index);
		// if (lineBlot.children.length > 1 || (lineBlot.children.length === 1 && !(lineBlot.children.head instanceof Break))) {
		// 	layoutDelta.insert('\n');
		// }

		// for (let i = 0; i < columns; i++) {
		// 	layoutDelta = layoutDelta.insert({ 'block': { container: LayoutContainer.blotName, width } });
		// }
		let key = genId(LayoutOuterContainer.blotName);
		let layoutDelta = createInsertDelta(quill, index);
		for (let i = 0; i < columns; i++) {
			layoutDelta = layoutDelta.insert({ 'block': { container: { blotName: LayoutContainer.blotName, width, container: { blotName: LayoutOuterContainer.blotName, key } } } });
		}

		quill.updateContents(
			layoutDelta,
			Quill.sources.USER
		);
	}

	isInLayout(current) {
		return current && current.parent
			? current.parent instanceof LayoutContainer
				? true
				: this.isInLayout(current.parent)
			: false;
	}
}