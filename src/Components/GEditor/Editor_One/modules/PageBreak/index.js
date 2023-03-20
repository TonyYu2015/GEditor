import Quill from "quill";
import PagePaddingManager from "./pagePadding";
import HeaderFooterManager, { HEADER_FOOTER } from './HeaderFooter';
import { editSize } from "../../common";

/**blots */
import PageContainer from './blots/pageContainer';
import KeyBoard, { addKeyBinding } from "../KeyBoard";
import { getNextIndex } from "../FreeContainer/blots/containerWrapper";
import PageHeader from "./HeaderFooter/blots/pageHeader";
import PageFooter from "./HeaderFooter/blots/pageFooter";

const Delta = Quill.import('delta');
const Module = Quill.import('core/module');

class PageBreak extends Module {
	static register() {
		Quill.register(PageContainer);
		Object.values(HEADER_FOOTER).forEach(blot => {
			Quill.register(blot);
		});
	}

	static pagePadding = [editSize.padding_top, editSize.padding, editSize.padding_bottom, editSize.padding];

	constructor(quill, options) {
		super(quill, options);
		this.PagePaddingManager = new PagePaddingManager(quill, this);
		this.HeaderFooterManager = new HeaderFooterManager(quill, this);
		this.isAllSelectPage = false;
		quill.root.addEventListener('click', (event) => {
			this.isAllSelectPage = false;
			if (this.HeaderFooterManager.editingBlot && !this.findEditingContentDom(event, this.HeaderFooterManager.editingBlot)) {
				this.HeaderFooterManager.stopEditingAndUpdate();
			}
		});

		this.quill.root.addEventListener("keydown", (e) => {
			if (e.key == KeyBoard.BACKSPACE || e.key == KeyBoard.ENTER) {
				if (this.isAllSelectPage) {
					this.clearAllSelected();
					this.isAllSelectPage = false;
					e.preventDefault();
					e.stopPropagation();
				}
			}

			if (e.ctrlKey && e.key == KeyBoard.A) {
				this.isAllSelectPage = true;
			}
			else {
				this.isAllSelectPage = false;
			}
		})

		this.addBindingRange(KeyBoard.ARROW_LEFT, 0);
		this.addBindingRange(KeyBoard.ARROW_RIGHT);
		this.addBindingRange(KeyBoard.ARROW_UP);
		this.addBindingRange(KeyBoard.ARROW_DOWN);
	}

	clearAllSelected = () => {
		let firstPage = this.getFirstPage();
		let lastPage = this.getLastPage();

		while (firstPage != lastPage) {
			lastPage.remove();
			lastPage = this.getLastPage();
		}

		firstPage?.clearContent();
	}


	addBindingRange = (key, offset) => {
		let _this = this;
		addKeyBinding(_this.quill,
			{ key },
			{
				offset,
				collapsed: true,
				priority: KeyBoard.PRIORITY_1
			},
			function limitRange(range) {
				let index = range.index;

				let [prev] = _this.quill.getLine(index);

				// 下个位置
				let nextNoramlIndex = getNextIndex(_this.quill, key, index);

				if (nextNoramlIndex < 0) {
					return false;
				}

				// 目标位置
				let nextTargetIndex = _this.getNextTargetIndex(_this.quill, key, index);
				let [next] = _this.quill.getLine(nextTargetIndex);

				if (!next) {
					return false;
				}

				let nextContainerName = next.getContainer && next.getContainer(next).statics.blotName;

				// 页眉、页脚内
				let headerFooter = _this.getHeaderFooter(prev);
				if (headerFooter && headerFooter !== _this.getHeaderFooter(next)) {
					return false;
				}

				// 文档尾处理
				if ((nextContainerName == "page-header" || nextContainerName == "page-footer") && _this.isInPageContainer(prev)) {
					return false;
				}

				if (nextNoramlIndex != nextTargetIndex) {

					// 容器设置了光标限制，则走容器内限制逻辑
					if (prev.getContainer && prev.getContainer(prev)?.isLimitCursorRange) {
						return true;
					}
					// console.log("跳过容器占位");
					_this.quill.setSelection(nextTargetIndex);
					return false;
				}

				return true;
			}
		);
	}

	getHeaderFooter(current) {
		return current && current.parent
			? (current.parent instanceof PageHeader) || (current.parent instanceof PageFooter)
				? current.parent
				: this.getHeaderFooter(current.parent)
			: null;
	}

	isInPageContainer(current) {
		return current && current.parent
			? current.parent instanceof PageContainer
				? current.parent
				: this.isInPageContainer(current.parent)
			: false;
	}

	getNextTargetIndex = (quill, key, index, containerName = null) => {
		let nextIndex = getNextIndex(quill, key, index);
		let ary = quill.getLine(nextIndex);
		let line = ary[0];
		while (nextIndex >= 0
			&& this.isNeedFindNext(line)
		) {

			nextIndex = getNextIndex(quill, key, nextIndex);
			ary = quill.getLine(nextIndex);
			line = ary[0];
		}
		return nextIndex;
	}

	isNeedFindNext = (line) => {
		if (!line) {
			return false;
		}

		if (line.getContainer && line.getContainer(line).isLimitCursorRange) {
			return true;
		}

		return false;
	}

	pageForEach(callback) {
		let cur = this.getFirstPage();
		while (cur instanceof PageContainer) {
			callback(cur);
			cur = cur.next;
		}
	}

	pageForEachExceptFirst(callback) {
		let firstPage = this.getFirstPage();
		let cur = firstPage.next;
		while (cur instanceof PageContainer) {
			callback(cur);
			cur = cur.next;
		}
	}

	getFirstPage() {
		let firstPage = this.quill.scroll.children.head;
		return (firstPage && firstPage instanceof PageContainer) ? firstPage : null;
	}

	getPageNum(page) {
		let index = 0;
		let nextPage = this.getFirstPage();
		while (nextPage && nextPage !== page && nextPage instanceof PageContainer) {
			nextPage = nextPage.next;
			index++;
		}
		return (index + 1);
	}

	isFirstPage(pageBlot) {
		let firstPage = this.getFirstPage();
		return pageBlot === firstPage;
	}

	getLastPage() {
		let prevPage = this.getFirstPage();
		let nextPage = prevPage;
		while (nextPage && nextPage instanceof PageContainer) {
			prevPage = nextPage;
			nextPage = nextPage.next;
		}
		return prevPage;
	}


	getPageLength() {
		let len = 0;
		this.pageForEach(() => {
			len++;
		});
		return len;
	}

	findEditingContentDom(event, editingBlot) {
		return event.path.find(dom => {
			return editingBlot.domNode === dom;
		});
	}



	updatePagePadding(pagePadding) {
		this.PagePaddingManager.updatePadding(pagePadding);
	}

	updateHeaderOrFooter(type) {
		this.HeaderFooterManager.insert(type);
	}


	addNewPage() {
		this._genOnePage();
	}

	_genOnePage() {
		const quill = this.quill;
		quill.NestContainerManager.initial();
		quill.updateContents(new Delta().retain(0).delete(1));
	}
}

export { PageBreak as default, PageContainer }
