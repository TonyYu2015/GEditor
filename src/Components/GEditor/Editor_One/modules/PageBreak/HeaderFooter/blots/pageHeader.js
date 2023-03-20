import Quill from "quill";
import BaseContainer from "./base";
import '../index.less';

export default class PageHeader extends BaseContainer {
	name = 'header';
	constructor(scroll, domNode, value) {
		super(scroll, domNode, value);
		this.quill = Quill.find(scroll.domNode.parentNode);
		if (this.pageBlot) {
			this.pageKey = this.pageBlot._value.key;
			this.top = this.calTop();
			this.height = this.calHeight();
			this._value.top = this.top;
			this._value.height = this.height;
			this._value.pageKey = this.pageKey;
		} else {
			this.top = value.top;
			this.height = value.height;
			this.pageKey = value.pageKey;
			let manager = this.quill.NestContainerManager;
			let blot = manager.getNestBlotByKey(value.pageKey);
			if (blot) {
				this.pageBlot = blot;
			}
		}
		const styleArr = [
			`min-height: ${this.height}px;`,
			`top: ${this.top}px;`,
		]
		domNode.setAttribute('style', styleArr.reduce((a, b) => a + ` ${b}`));
	}

	turnToEditMode() {
		super.turnToEditMode();
		this.setToolbar();
	}

	setToolbar(isFirstDiff) {
		const pageBreak = this.quill.getModule('pageBreak');
		let isFirst = !this.pageBlot.prev;
		pageBreak.HeaderFooterManager.headerFooterAttach.updateYemei(this.domNode.offsetTop + this.domNode.offsetHeight, isFirst, isFirstDiff);
	}

	updateToolbarPosition(entry) {
		this.PageBreakModule.HeaderFooterManager.headerFooterAttach.updatePosition(this.domNode.offsetTop + entry.contentRect.height);
	}


	calHeight() {
		return parseInt(this.pageBlot.domNode.style.paddingTop, 10);
	}

	calTop() {
		let borderTop = parseInt(this.domNode.style.borderTopWidth, 10);
		borderTop = isNaN(borderTop) ? 0 : borderTop;
		return this.pageBlot.domNode.offsetTop - borderTop;
	}

	updatePosition() {
		let editContainer = this.parent;
		let pageContainer = editContainer.parent;
		let topAndHeight = parseInt(pageContainer.domNode.style.paddingTop);
		if (this.children.head && parseInt(this.domNode.style.top) !== topAndHeight) {
			this.domNode.style.top = `-${topAndHeight}px`;
			this.attachAttrsToFlag({ top: topAndHeight });
		}

		if (this.children.head && parseInt(this.domNode.style.height) !== topAndHeight) {
			this.domNode.style.height = `${topAndHeight}px`;
			this.attachAttrsToFlag({ heigt: topAndHeight });
		}
	}

	optimize(context) {
		super.optimize(context);
		// this.updatePosition();
	}
}

PageHeader.blotName = 'page-header';
PageHeader.tagName = 'DIV';
PageHeader.className = 'ql-page-header';