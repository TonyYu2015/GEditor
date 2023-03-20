import Quill from "quill";
import PageHeader from './blots/pageHeader';
import PageFooter, { PageNum } from './blots/pageFooter';
import PageHeaderFirst from './blots/pageHeaderFirst';
import PageFooterFirst from './blots/pageFooterFirst';
import BaseContainer from './blots/base';
import RenderHeaderFooterAttach from "../components/HeaderFooterAttach";
import './index.less';
import { compareObject } from "../../../utility";


const HEADER_FOOTER = {
	[PageHeader.blotName]: PageHeader,
	[PageFooter.blotName]: PageFooter,
	[PageHeaderFirst.blotName]: PageHeaderFirst,
	[PageFooterFirst.blotName]: PageFooterFirst,
}

const YE_MEI = 'header';
const YE_JIAO = 'footer';

const Delta = Quill.import('delta');

class HeaderAndFooter {

	header;
	footer;

	constructor({ pageBlot, quill }) {
		this.pageBlot = pageBlot;
		this.quill = quill;
	}

	updateSizeAndPosition(pagePadding) {
		if (this.header && this.header.domNode.offsetHeight !== pagePadding[0]) {
			this.header.domNode.style.minHeight = `${pagePadding[0]}px`;
		}
		if (this.footer && this.footer.domNode.offsetHeight !== pagePadding[2]) {
			let footerTop = this.footer.domNode.offsetTop;
			let footerHeight = this.footer.domNode.offsetHeight;
			this.footer.domNode.style.minHeight = `${pagePadding[2]}px`;
			this.footer.domNode.style.top = `${footerTop + footerHeight - pagePadding[2]}px`;
		}
	}

	/**
	 * 新增一页时复制页眉或页脚
	 */
	copyHeaderOrFooter() {
		setTimeout(() => {
			this.copyHeaderOrFooterSync();
		});
	}
	copyHeaderOrFooterSync() {
		const pageBlot = this.pageBlot;
		const quill = this.quill;
		const header = pageBlot.prev.HeaderAndFooter.header;
		const footer = pageBlot.prev.HeaderAndFooter.footer;
		if (header) {
			this.insertHeader();
			if (!(header instanceof PageHeaderFirst)) {
				let startIndex = quill.getIndex(header);
				let delta = quill.getContents(startIndex, header.length());

				this.update(this.header, delta);
			}
		}

		if (footer) {
			this.insertFooter();
			if (!(footer instanceof PageFooterFirst)) {
				let startIndex = quill.getIndex(footer);
				let delta = quill.getContents(startIndex, footer.length());

				this.update(this.footer, delta);
				// this.checkPageNum();
			}
		}
	}

	/**
	 * 检查页码
	 */
	checkPageNum() {
		this.pageBlot.scroll.children.forEach(pageBlot => {
			let [pageNum] = pageBlot.descendants(PageNum);
			pageNum && pageNum.checkPageNum();
		});
	}

	/**空页眉和空页脚 */
	insertHeader(headerBlotName = PageHeader.blotName) {
		let nextBlot = null;
		let insertIndex = this.quill.getLength();
		if (this.header) {
			nextBlot = this.header.next;
			this.removeHeader();
		} else if (this.pageBlot.prev !== null) {
			let prevHeader = this.pageBlot.prev.HeaderAndFooter.header;
			nextBlot = prevHeader.next;
		}

		if (nextBlot) {
			insertIndex = this.quill.getIndex(nextBlot);
		}

		this.quill.updateContents(
			new Delta().retain(insertIndex).insert({ "block": { container: headerBlotName, pageBlot: this.pageBlot } })
		);

		let [block] = this.quill.getLine(insertIndex);
		this.header = block.parent;
	}

	insertFooter(footerBlotName = PageFooter.blotName) {
		let nextBlot = null;
		let insertIndex = this.quill.getLength();
		if (this.footer) {
			nextBlot = this.footer.next;
			this.removeFooter();
		} else if (this.pageBlot.prev !== null) {
			let prevFooter = this.pageBlot.prev.HeaderAndFooter.footer;
			nextBlot = prevFooter.next;
		}

		if (nextBlot) {
			insertIndex = this.quill.getIndex(nextBlot);
		}

		this.quill.updateContents(
			new Delta().retain(insertIndex).insert({ "block": { container: footerBlotName, pageBlot: this.pageBlot } })
		);

		let [block] = this.quill.getLine(insertIndex);
		this.footer = block.parent;
	}

	update(blot, delta) {
		if (!blot || !delta) {
			return;
		}

		let startIndex = this.quill.getIndex(blot);
		if (startIndex === -1) {
			return;
		}
		let content = this.quill.getContents(startIndex, blot.length());

		let isChanged = false;
		let result = compareObject(content, delta);
		if (result?.length > 0) {
			isChanged = true;
		}

		if (!isChanged) {
			return;
		}

		/**TODO:比较新delta与当前delta值差异，避免全部更新 */
		let newDelta = new Delta()
			.retain(startIndex)
			.delete(blot.length())
			.concat(delta);

		this.quill.updateContents(newDelta);
	}

	remove() {
		this.removeHeader();
		this.removeFooter();
	}

	removeHeader() {
		if (this.header) {
			this.header.remove();
			this.header = null;
		}
	}

	removeFooter() {
		if (this.footer) {
			this.footer.remove();
			this.footer = null;
		}
	}
}

class HeaderFooterManager {

	editingBlot = null;

	/**delta data */
	firstHeader = null;
	firstFooter = null;
	header = null;
	footer = null;

	firstHeaderHeight = null;
	firstFooterHeight = null;

	constructor(quill, pageBreak) {
		this.quill = quill;
		this.pageBreak = pageBreak;
		this.headerFooterAttach = new HeaderFooterAttachModule(quill.scroll.domNode.parentNode, pageBreak);
	}

	initialize() {
		let firstPage = this.pageBreak.getFirstPage();
		this.headerFooterAttachPageblot();
		let header = firstPage.HeaderAndFooter.header;
		let footer = firstPage.HeaderAndFooter.footer;
		if (header) {
			if (header instanceof PageHeaderFirst) {
				this.firstHeaderHeight = header.domNode.offsetHeight;
				this.firstHeader = this.getDeltaContent(header);
				if (this.pageBreak.getPageLength() > 1) {
					let secondHeader = firstPage.next.HeaderAndFooter.header;
					this.header = this.getDeltaContent(secondHeader);
				}
			} else {
				this.header = this.getDeltaContent(header);
			}
		}

		if (footer) {
			if (footer instanceof PageFooterFirst) {
				this.firstFooterHeight = footer.domNode.offsetHeight;
				this.firstFooter = this.getDeltaContent(footer);
				if (this.pageBreak.getPageLength() > 1) {
					let secondFooter = firstPage.next.HeaderAndFooter.footer;
					this.footer = this.getDeltaContent(secondFooter);
				}
			} else {
				this.footer = this.getDeltaContent(footer);
			}
		}
	}

	headerFooterAttachPageblot() {
		this.quill.scroll.children.forEach(blot => {
			if (blot instanceof BaseContainer) {
				blot.attachToPageBlot();
			}
		})
	}

	getDeltaContent(blot) {
		let startIndex = this.quill.getIndex(blot);
		return this.quill.getContents(startIndex, blot.length());
	}

	reset() {
		this.editingBlot = null;
		this.header = null;
		this.footer = null;
		this.firstHeader = null;
		this.firstFooter = null;
	}

	resetEditingBlot() {
		this.editingBlot.recoverDefault();
		this.editingBlot = null;
	}

	isFirstPageHeaderDifferent() {
		let firstPage = this.pageBreak.getFirstPage();
		return firstPage.HeaderAndFooter.header instanceof PageHeaderFirst;
	}

	isFirstPageFooterDifferent() {
		let firstPage = this.pageBreak.getFirstPage();
		return firstPage.HeaderAndFooter.footer instanceof PageFooterFirst;
	}

	stopEditingAndUpdate() {
		this.quill.stopRecording = false;
		this.headerFooterAttach.reset();

		if (this.editingBlot instanceof PageHeaderFirst) {
			this.firstHeaderHeight = this.editingBlot.domNode.offsetHeight;
			this.pageBreak.PagePaddingManager.updateFirstPagePaddingTop(this.firstHeaderHeight);
			this.firstHeader = this.getDeltaContent(this.editingBlot);
		} else if (this.editingBlot instanceof PageFooterFirst) {
			this.firstFooterHeight = this.editingBlot.domNode.offsetHeight;
			this.pageBreak.PagePaddingManager.updateFirstPagePaddingBottom(this.firstFooterHeight);
			this.firstFooter = this.getDeltaContent(this.editingBlot);
		} else if (this.editingBlot instanceof PageHeader) {
			this.pageBreak.PagePaddingManager.updatePaddingTop(this.editingBlot.domNode.offsetHeight);
			this.header = this.getDeltaContent(this.editingBlot);
			this.updateHeader(this.header);
		} else if (this.editingBlot instanceof PageFooter) {
			this.pageBreak.PagePaddingManager.updatePaddingBottom(this.editingBlot.domNode.offsetHeight);
			this.footer = this.getDeltaContent(this.editingBlot);
			this.updateFooter(this.footer);
		}

		this.resetEditingBlot();
	}

	turnToHeader() {
		let firstPage = this.pageBreak.getFirstPage();
		let HeaderAndFooter = firstPage.HeaderAndFooter;
		HeaderAndFooter.insertHeader();
		if (this.header) {
			HeaderAndFooter.update(HeaderAndFooter.header, this.header);
		}
		return HeaderAndFooter.header;
	}

	turnToFirstHeader() {
		let firstPage = this.pageBreak.getFirstPage();
		let HeaderAndFooter = firstPage.HeaderAndFooter;
		HeaderAndFooter.insertHeader(PageHeaderFirst.blotName);
		if (this.firstHeader) {
			HeaderAndFooter.update(HeaderAndFooter.header, this.firstHeader);
		}
		return HeaderAndFooter.header;
	}

	turnToFooter() {
		let firstPage = this.pageBreak.getFirstPage();
		let HeaderAndFooter = firstPage.HeaderAndFooter;
		HeaderAndFooter.insertFooter();
		if (this.footer) {
			HeaderAndFooter.update(HeaderAndFooter.footer, this.footer);
		}
		return HeaderAndFooter.footer;
	}

	turnToFirstFooter() {
		let firstPage = this.pageBreak.getFirstPage();
		let HeaderAndFooter = firstPage.HeaderAndFooter;
		HeaderAndFooter.insertFooter(PageFooterFirst.blotName);
		if (this.firstFooter) {
			HeaderAndFooter.update(HeaderAndFooter.footer, this.firstFooter);
		}
		return HeaderAndFooter.footer;
	}

	toggleFirstPage(tag, isDiff) {
		this.resetEditingBlot();
		let firstPage = this.pageBreak.getFirstPage();
		let firstPagePadding = firstPage.getPadding();
		let curEditingBlot = null;
		if (tag === YE_MEI && isDiff) {
			if (this.firstHeaderHeight) {
				firstPagePadding[0] = this.firstHeaderHeight;
				firstPage.domNode.style.padding = this.pageBreak.PagePaddingManager.addPx(firstPagePadding);
			}
			curEditingBlot = this.turnToFirstHeader();
		} else if (tag === YE_MEI && !isDiff) {
			if (this.pageBreak.getPageLength() > 1) {
				let headerHeight = firstPage.next.HeaderAndFooter.header.domNode.offsetHeight;
				firstPagePadding[0] = headerHeight;
				firstPage.domNode.style.padding = this.pageBreak.PagePaddingManager.addPx(firstPagePadding);
			}
			curEditingBlot = this.turnToHeader();
		} else if (tag === YE_JIAO && isDiff) {
			if (this.firstFooterHeight) {
				firstPagePadding[2] = this.firstFooterHeight;
				firstPage.domNode.style.padding = this.pageBreak.PagePaddingManager.addPx(firstPagePadding);
			}
			curEditingBlot = this.turnToFirstFooter();
		} else if (tag === YE_JIAO && !isDiff) {
			if (this.pageBreak.getPageLength() > 1) {
				let footerHeight = firstPage.next.HeaderAndFooter.footer.domNode.offsetHeight;
				firstPagePadding[2] = footerHeight;
				firstPage.domNode.style.padding = this.pageBreak.PagePaddingManager.addPx(firstPagePadding);
			}
			curEditingBlot = this.turnToFooter();
		}

		curEditingBlot.turnToEditMode();
	}

	updateHeader(delta) {
		if (this.isFirstPageHeaderDifferent()) {
			this.pageBreak.pageForEachExceptFirst(pageBlot => {
				pageBlot.HeaderAndFooter.update(pageBlot.HeaderAndFooter.header, delta);
			})
		} else {
			this.pageBreak.pageForEach(pageBlot => {
				pageBlot.HeaderAndFooter.update(pageBlot.HeaderAndFooter.header, delta);
			});
		}
	}

	updateFooter(delta) {
		if (this.isFirstPageFooterDifferent()) {
			this.pageBreak.pageForEachExceptFirst(pageBlot => {
				pageBlot.HeaderAndFooter.update(pageBlot.HeaderAndFooter.footer, delta);
			})
		} else {
			this.pageBreak.pageForEach(pageBlot => {
				pageBlot.HeaderAndFooter.update(pageBlot.HeaderAndFooter.footer, delta);
			});
		}
	}

	removeHeader() {
		this.resetEditingBlot();
		this.headerFooterAttach.reset();
		this.pageBreak.pageForEach((pageBlot) => {
			pageBlot.HeaderAndFooter.removeHeader();
		});
	}

	removeFooter() {
		this.resetEditingBlot();
		this.headerFooterAttach.reset();
		this.pageBreak.pageForEach((pageBlot) => {
			pageBlot.HeaderAndFooter.removeFooter();
		});
	}

	removeHF(tag) {
		if (tag === YE_MEI) {
			this.removeHeader();
		} else {
			this.removeFooter();
		}
	}


	insert(type) {
		const typeArr = type.split('-');

		this.reset();
		let editBlot;
		switch (typeArr[1]) {
			case 'header_normal':
				this.pageBreak.pageForEach((pageBlot) => {
					pageBlot.HeaderAndFooter.insertHeader();
				});
				editBlot = this.pageBreak.getFirstPage().HeaderAndFooter.header;
				break;
			case 'footer_normal':
				this.pageBreak.pageForEach((pageBlot) => {
					pageBlot.HeaderAndFooter.insertFooter();
				});
				editBlot = this.pageBreak.getFirstPage().HeaderAndFooter.footer;
				break;
			default:
				throw new Error('must give a name!');
		}
		editBlot.turnToEditMode();
	}
}


class HeaderFooterAttachModule {

	top = -1;
	display = 'none';

	constructor(container, pageBreak) {
		this.pageBreak = pageBreak;
		this.initial(container);
	}

	initial(container) {
		this.divContainer = document.createElement('div');
		this.divContainer.classList.add('header_footer_toobar');
		let style = {
			top: `${this.top}px`,
			display: this.display,
		}
		this.divContainer.setAttribute('style', Object.entries(style).reduce((p, a) => `${p}${a[0]}: ${a[1]}; `, ''))
		container.appendChild(this.divContainer);
		RenderHeaderFooterAttach({ container: this.divContainer, isFirst: false, text: '页眉' });
	}

	update(text, top, isFirst, isFirstDiff) {
		this.divContainer.style.top = `${top}px`;
		this.divContainer.style.display = `block`;
		let headerFooterManager = this.pageBreak.HeaderFooterManager;
		let toggleFirstPage = headerFooterManager.toggleFirstPage.bind(headerFooterManager, text);
		let remove = headerFooterManager.removeHF.bind(headerFooterManager, text);
		RenderHeaderFooterAttach({ container: this.divContainer, isFirst, text, remove, isFirstDiff, toggleFirstPage });
	}

	updatePosition(top) {
		this.divContainer.style.top = `${top}px`;
	}

	updateYemei(...args) {
		this.update(YE_MEI, ...args);
	}

	updateYejiao(...args) {
		this.update(YE_JIAO, ...args);
	}

	reset() {
		this.divContainer.style.top = `${this.top}px`;
		this.divContainer.style.display = `${this.display}`;
	}

	destory() {

	}
}

export {
	HeaderFooterManager as default,
	HeaderFooterAttachModule,
	HeaderAndFooter,
	HEADER_FOOTER
}