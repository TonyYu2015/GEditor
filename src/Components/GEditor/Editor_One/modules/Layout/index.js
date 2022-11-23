import Quill from "quill";
import Resize from './resize';
import { getEventComposedPath } from "../../common";
import LayoutContextMenu from "../../components/ContextMenu";
import { ContainerFlag } from "../FreeContainer";
import OuterContainer from "../../blots/outerContainer";

const Delta = Quill.import('delta');
const Module = Quill.import('core/module');
const Container = Quill.import("blots/container");
const Break = Quill.import('blots/break');

class LayoutFlag extends ContainerFlag {
}

LayoutFlag.tagName = 'P';
LayoutFlag.blotName = 'layout-flag';
LayoutFlag.className = 'ql-layout-flag';

class LayoutOuterContainer extends Container {
	static create(value) {
		const domNode = super.create(value);
		domNode.setAttribute('style', 'width: 100%; display: flex;');
		return domNode;
	}

	constructor(scroll, domNode, value) {
		super(scroll, domNode, value);
		// domNode.addEventListener('click', (evt) => {
		// 	if (evt.target === this.domNode) {
		// 		this.remove();
		// 		if (this.parent.children.length === 0) {
		// 			const blot = this.scroll.create('block');
		// 			blot.wrap(this.parent);
		// 		}
		// 	}
		// });

		// domNode.addEventListener('mouseenter', (e) => {
		// 	let editContainer = this.children.tail;
		// 	if (
		// 		editContainer
		// 		&& editContainer.statics.blotName === 'edit-container'
		// 	) {
		// 		let width = editContainer.children.head.domNode.style.width;
		// 		let resize = this.scroll.create('layout-resize', { width: parseInt(width) || 0 });
		// 		editContainer.appendChild(resize);
		// 	}
		// });

		// domNode.addEventListener('mouseleave', (e) => {
		// 	let editContainer = this.children.tail;
		// 	let tail = editContainer.children.tail;
		// 	if (tail.statics.blotName === 'layout-resize') {
		// 		tail.remove();
		// 	}
		// });
	}
}

LayoutOuterContainer.blotName = "layout-outer";
LayoutOuterContainer.tagName = "DIV";
LayoutOuterContainer.className = "ql-layout-outer";

export class LayoutContainer extends OuterContainer {
	static create(value) {
		const domNode = super.create(value);
		const styleArr = [
			`width: ${value.width}%;`,
			`display: inline-block;`,
			`vertical-align: top;`,
			`word-break: break-all;`,
			`position: relative;`,
			`max-height: 1000px;`
		];
		domNode.setAttribute('style', styleArr.reduce((a, b) => a + ` ${b}`));
		return domNode;
	}

	constructor(scroll, domNode, value) {
		super(scroll, domNode, value);
		const quill = Quill.find(scroll.domNode.parentNode);

		/**
		 * 右键菜单
		 */
		if(!quill.layoutContextMenu) {
			quill.layoutContextMenu = new LayoutContextMenu(
				quill,
				[
					{
						text: "删除分栏",
						clickEvt: (layoutBlot, event) => {
							layoutBlot.remove();

							if (layoutBlot.parent.children.length === 0) {
								const blot = layoutBlot.scroll.create('block');
								blot.wrap(layoutBlot.parent);
							}
						}
					}
				]
			);
		}
		domNode.addEventListener("contextmenu", (e) => {
			e.preventDefault();
			let path = getEventComposedPath(e);
			if (!path || path.length <= 0) return;
			let layouterNode = path.filter(node => {
				return node.tagName && node.classList.contains("ql-layout-outer");
			});
			const layoutBlot = Quill.find(layouterNode[0]);
			quill.layoutContextMenu.render({
				left: e.pageX,
				top: e.pageY
			}, layoutBlot);
		}, false);
	}
}

LayoutContainer.blotName = "layout-container";
LayoutContainer.tagName = "DIV";
LayoutContainer.className = "ql-layout-container";

LayoutFlag.requiredContainer = LayoutContainer;

LayoutContainer.requiredContainer = LayoutOuterContainer;
LayoutOuterContainer.allowedChildren = [LayoutContainer];

export default class Layout extends Module {

	static register() {
		Quill.register(LayoutFlag);
		Quill.register(LayoutOuterContainer);
		Quill.register(LayoutContainer);
		Quill.register(Resize);
	}

	constructor(quill, options) {
		super(quill, options);
	}

	insertLayout({ span, index }) {
		const quill = this.quill;
		// const range = quill.getSelection();
		// if (!index && !range) return;
		// index = range?.index || index;
		let columnsInfo = span.split("-");
		let columns = +columnsInfo[0];
		let childlength = columns * 2 + 1;
		let width = Math.floor(100 / columns);

		let currentBlot = quill.getLeaf(index)[0];
		if (this.isInLayout(currentBlot)) return;

		let layoutDelta = new Delta()
			.retain(index);

		let [lineBlot] = quill.getLine(index);
		if (lineBlot.children.length > 1 || (lineBlot.children.length === 1 && !(lineBlot.children.head instanceof Break))) {
			layoutDelta.insert('\n');
		}

		for (let i = 0; i < columns; i++) {
			layoutDelta = layoutDelta.insert({ [LayoutFlag.blotName]: { width } });
		}

		quill.updateContents(
			layoutDelta,
			Quill.sources.USER
		);
		const [line, offset] = quill.getLine(index + 1);
		line.parent.addFocusedChange();
	}

	isInLayout(current) {
		return current && current.parent
			? current.parent instanceof LayoutContainer
				? true
				: this.isInLayout(current.parent)
			: false;
	}
}