import { editSize } from "../../common";

class PagePaddingManager {
	constructor(quill, pageBreak) {
		this.quill = quill;
		this.pageBreakModule = pageBreak;
		this.padding_left = editSize.padding;
		this.padding_right = editSize.padding;
		this.padding_top = editSize.padding_top;
		this.padding_bottom = editSize.padding_bottom;
	}

	updateFromUser(pagePadding) {
		this.padding_top = pagePadding[0];
		this.padding_right = pagePadding[1];
		this.padding_bottom = pagePadding[2];
		this.padding_left = pagePadding[3];
	}

	getPadding(value) {
		return this.addPx([
			value.padding_top || this.padding_top,
			value.padding_right || this.padding_right,
			value.padding_bottom || this.padding_bottom,
			value.padding_left || this.padding_left
		]);
	}

	updateFirstPagePaddingTop(val) {
		this.updateFirstPage({ top: val });
	}

	updateFirstPagePaddingBottom(val) {
		this.updateFirstPage({ bottom: val });
	}

	updatePaddingTop(val) {
		this.padding_top = val;
		this.updateFirstPage();
		this.updateExceptFirstPage();
	}

	updatePaddingBottom(val) {
		this.padding_bottom = val;
		this.updateFirstPage();
		this.updateExceptFirstPage();
	}

	/**
	 * 
	 * @param {*} pagePadding 
	 */
	updatePadding(pagePadding) {
		this.updateFromUser(pagePadding);
		this.updateFirstPage();
		this.updateExceptFirstPage();

	}

	updateFirstPage(size = {}) {
		let firstPage = this.pageBreakModule.getFirstPage();
		let firstPagePadding = firstPage.getPadding();
		firstPagePadding[1] = this.padding_right;
		firstPagePadding[3] = this.padding_left;
		if (size.top) {
			firstPagePadding[0] = size.top;
		} else if (!this.pageBreakModule.HeaderFooterManager.isFirstPageHeaderDifferent()) {
			firstPagePadding[0] = this.padding_top;
		}

		if (size.bottom) {
			firstPagePadding[2] = size.bottom;
		} else if (!this.pageBreakModule.HeaderFooterManager.isFirstPageFooterDifferent()) {
			firstPagePadding[2] = this.padding_bottom;
		}
		firstPage.domNode.style.padding = this.addPx(firstPagePadding);
		firstPage.HeaderAndFooter.updateSizeAndPosition(firstPagePadding);
	}

	updateExceptFirstPage() {
		let pagePadding = [this.padding_top, this.padding_right, this.padding_bottom, this.padding_left];
		this.pageBreakModule.pageForEachExceptFirst(pageBlot => {
			pageBlot.domNode.style.padding = this.addPx(pagePadding);
			pageBlot.HeaderAndFooter.updateSizeAndPosition(pagePadding);
		});
	}

	addPx(sizeArr) {
		sizeArr = Array.isArray(sizeArr) ? sizeArr : [sizeArr];
		return sizeArr.reduce((a, b) => `${a} ${b}px`, '');
	}
}

export { PagePaddingManager as default };