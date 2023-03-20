import Quill from "quill";
import BaseContainer from "./base";
import '../index.less';

const BlockEmbed = Quill.import("blots/block/embed");

export default class PageFooter extends BaseContainer {
	static register() {
		Quill.register(PageNum);
	}
	name = 'footer';

	// 高度为页下边距,绝对定位附着于页面底部
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
		domNode.setAttribute('contenteditable', false);
	}

	turnToEditMode() {
		super.turnToEditMode();
		this.setToolbar();
	}

	setToolbar(isFirstDiff) {
		const pageBreak = this.quill.getModule('pageBreak');
		let isFirst = !this.pageBlot.prev;
		pageBreak.HeaderFooterManager.headerFooterAttach.updateYejiao(this.domNode.offsetTop - 24, isFirst, isFirstDiff);
	}

	updateToolbarPosition(entry) {
		let top = this.domNode.offsetTop - (entry.contentRect.height - this.height);
		this.height = this.domNode.offsetHeight;
		this.domNode.style.top = `${top}px`;
		this.PageBreakModule.HeaderFooterManager.headerFooterAttach.updatePosition(top - 24);
	}

	calHeight() {
		return parseInt(this.pageBlot.domNode.style.paddingBottom, 10);
	}

	calTop() {
		let borderTop = parseInt(this.domNode.style.borderTopWidth, 10);
		borderTop = isNaN(borderTop) ? 0 : borderTop;
		let pagePaddingBottom = parseInt(this.pageBlot.domNode.style.paddingBottom, 10);
		pagePaddingBottom = isNaN(pagePaddingBottom) ? 0 : pagePaddingBottom;
		return this.pageBlot.domNode.offsetTop + this.pageBlot.domNode.clientHeight - pagePaddingBottom;
	}

	optimize(context) {
		super.optimize(context);
		// this.updatePosition();
	}

	updatePosition() {
		let editContainer = this.parent;
		let pageContainer = editContainer.parent;
		let top = pageContainer.domNode.clientHeight - parseInt(pageContainer.domNode.style.paddingTop) - parseInt(pageContainer.domNode.style.paddingBottom);
		let height = parseInt(pageContainer.domNode.style.paddingBottom);
		if (this.children.head && parseInt(this.domNode.style.top) !== top) {
			this.domNode.style.top = `${top}px`;
			this.attachAttrsToFlag({ top });
		}
		if (this.children.head && parseInt(this.domNode.style.height) !== height) {
			this.domNode.style.height = `${height}px`;
			this.attachAttrsToFlag({ height });
		}
	}
}

PageFooter.blotName = 'page-footer';
PageFooter.tagName = 'DIV';
PageFooter.className = 'ql-page-footer';


export class PageNum extends BlockEmbed {
	static create(value) {
		let domNode = super.create();
		if (value.num && value.total) {
			domNode.dataset.num = value.num;
			domNode.dataset.total = value.total;
			domNode.innerText = `${value.num || 1}/${value.total}`;
		}
		domNode.setAttribute('style', 'position: absolute; right: 0; top: 3px;');
		domNode.setAttribute('contenteditable', false);
		return domNode;
	}

	static value(domNode) {
		return {
			num: domNode.dataset.num,
			total: domNode.dataset.total
		}
	}

	optimize(context) {
		super.optimize(context);
		this.checkPageNum();
	}

	constructor(scroll, domNode, value) {
		super(scroll, domNode, value);
		this.quill = Quill.find(scroll.domNode.parentNode);
	}

	checkPageNum() {
		let pageBlot = this.findPageContainer(this);
		if (pageBlot && !this.quill.isLoadingRender) {
			let num = pageBlot.children.head.domNode.dataset.pagenum;
			if (
				(!this.domNode.dataset.num || !this.domNode.dataset.total)
				|| (
					this.domNode.dataset.num
					&& this.domNode.dataset.total
					&& (this.domNode.dataset.num !== num || +this.domNode.dataset.total !== this.scroll.children.length)
				)
			) {
				this.domNode.dataset.total = this.scroll.children.length;
				this.domNode.dataset.num = pageBlot.children.head.domNode.dataset.pagenum;
				this.domNode.innerText = `${this.domNode.dataset.num}/${this.domNode.dataset.total}`;
			}
		}
	}

	findPageContainer(blot) {
		if (blot.parent) {
			if (blot.parent.statics.blotName === 'page-container') {
				return blot.parent;
			} else {
				return this.findPageContainer(blot.parent);
			}
		}
	}
}

PageNum.blotName = 'page-num';
PageNum.tagName = 'SPAN';
PageNum.className = 'ql-page-num';