import Quill from "quill";
import { addMouseMove, getEventComposedPath } from "../../common";
import LayoutContextMenu from "../../components/ContextMenu";
import { createInsertDelta } from "../../utility";
import ContainerWrapper from "../FreeContainer/blots/containerWrapper";

const Module = Quill.import('core/module');

/**
 * 1. move freely in a page
 * 2. resize
 * 3. only text
 */

class FreeText extends ContainerWrapper {

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
		this.isLimitCursorRange = true;
		const quill = Quill.find(scroll.domNode.parentNode);
		addMouseMove(domNode);
		this.unallowedChildrenNames = ["full-width-wrapper", "materialImageContainer"];
		let _this = this;

		domNode.addEventListener('mouseup', (e) => {
			_this.handleMouseUp();
		});

		/**
		 * 添加右键菜单功能
		 */
		domNode.addEventListener("contextmenu", (e) => {
			e.preventDefault();
			e.stopPropagation();
			let path = getEventComposedPath(e);
			if (!path || path.length <= 0) return;
			new LayoutContextMenu({
				left: e.pageX,
				top: e.pageY
			}, quill, [
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

	handleMouseUp = () => {
		if (this.children.tail?.calChildrenLen)
			this.children.tail.calChildrenLen();
	}


	addFocusedChange() {
		this.scroll.focusedContainer = this;
		if (this.statics.blotName === 'page-container') return;
		this.domNode.classList.add('ql-free-text-focused');
	}

	removeFocusedChange() {
		this.domNode.classList.remove('ql-free-text-focused');
	}

	optimize(context) {
		super.optimize(context);
		let curWidth = this.domNode.offsetWidth;
		let curHeight = this.domNode.offsetHeight;

		let curLeft = this.domNode.offsetLeft;
		let curTop = this.domNode.offsetTop;

		if (this.width !== curWidth || this.height !== curHeight) {
			this.width = curWidth;
			this.height = curHeight;
			this.attachAttrsToFlag({ containerwidth: curWidth, containerheight: curHeight });
		}

		if (this.left !== curLeft || this.top !== curTop) {
			this.left = curLeft;
			this.top = curTop;
			this.attachAttrsToFlag({ containerleft: curLeft, containertop: curTop });
		}


		let obj = this._value;
		let style = this.domNode.style;
		if (curLeft != obj.containerleft) {
			style.left = `${obj.containerleft}px`;
		}

		if (curTop != obj.containerleft) {
			style.top = `${obj.containertop}px`;
		}

		if (curWidth != obj.containerwidth) {
			style.width = `${obj.containerwidth}px`;
		}

		if (curHeight != obj.containerheight) {
			style.height = `${obj.containerheight}px`;
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

	insert({ index }) {
		const quill = this.quill;
		// let focusedContainer = quill.scroll.focusedContainer;
		// if (focusedContainer) {
		// 	if (focusedContainer.statics.blotName === "full-width-wrapper") {
		// 		let lastBlot = focusedContainer.children.tail;
		// 		index = quill.getIndex(lastBlot);
		// 	}
		// }
		if (index === -1) {
			return;
		}

		let currentBlot = quill.getLeaf(index)[0]
		if (this.isInFreeText(currentBlot))
			return;

		const [line] = quill.getLine(index);

		let containerleft = 0;
		let containertop = 0;
		if (line) {
			let parentContainer = line.parent;
			if (parentContainer.statics.blotName === "page-container") {
				let style = parentContainer.domNode.style;
				containerleft = parseInt(style.paddingLeft);
				let bound = quill.getBounds(index);
				// 文本框创建Y坐标，绝对坐标转相对，20页间隔
				containertop = bound.top - (parseInt(style.minHeight) + 20) * (parentContainer.pagenum - 1);
			}
		}
		let layoutDelta = createInsertDelta(quill, index).insert({ 'block': { container: FreeText.blotName, containerleft, containertop, containerwidth: 100, containerheight: 100 } });
		quill.updateContents(
			layoutDelta,
			Quill.sources.USER
		);

	}

	isInFreeText(current) {
		return current && current.parent
			? current.parent instanceof FreeText
				? true
				: this.isInFreeText(current.parent)
			: false
	}
}