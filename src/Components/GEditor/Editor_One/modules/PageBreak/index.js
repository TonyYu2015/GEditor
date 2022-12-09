import Quill from "quill";
import HeaderAndFooter, { HEADER_FOOTER } from "./headerAndFooter";
import { ContainerFlag, ContainerWrapper, getContainer } from "../FreeContainer";
import OuterContainer from "../../blots/outerContainer";
import { editSize } from '../../common';
import "./index.less";

const Delta = Quill.import('delta');
const Module = Quill.import('core/module');
const Break = Quill.import("blots/break");
const OriginContainer = Quill.import('blots/container');

class PageBreakFlag extends ContainerFlag {
	nested = false;
}

PageBreakFlag.tagName = 'P';
PageBreakFlag.blotName = 'pagebreak-flag';
PageBreakFlag.className = 'ql-pagebreak-flag';

export class PageContainer extends OuterContainer {
	static create(value) {
		let domNode = super.create(value);
		const styleArr = [
			`min-height: ${PageContainer.DEFAULT_OPTION.pageSize[1]}px;`,
			`padding: ${addPx(PageBreak.pagePadding)};`,
		]
		domNode.setAttribute('style', styleArr.reduce((a, b) => a + ` ${b}`));
		return domNode;
	}

	constructor(scroll, domNode, value) {
		super(scroll, domNode, value);
		this._value = value;
		this.quill = Quill.find(scroll.domNode.parentNode);
		this.HeaderAndFooter = new HeaderAndFooter({ pageBlot: this, quill: this.quill });
	}

	optimize(context) {
		super.optimize(context);
		if (!(this.children.head instanceof PageBreakFlag)) return;
		const quill = Quill.find(this.scroll.domNode.parentNode);
		const pageSizeOption = PageContainer.DEFAULT_OPTION;
		if (isChildrenWorkOver(this) && !quill.isLoadingRender) {
			this.checkAndUpdatePagenum();
			const thisHeight = this.domNode.clientHeight;
			const pageContainerHeight = pageSizeOption.pageSize[1];
			if (thisHeight > pageContainerHeight) {
				let moveBlot = Quill.find(this.domNode.lastChild);
				if (!this.next) {
					this.genNewPage(moveBlot);
				} else {
					this.moveContentToNext(moveBlot);
				}
				setTimeout(this.resetNextSelection.bind(this));
			} else if (this.next && !this.checkNextNoContent()) {
				this.moveContentToPrev();
			}
		}
	}

	genNewPage(moveBlot) {
		const flag_container = this.scroll.create(PageBreakFlag.blotName, { pagenum: this.scroll.children.length + 1, level: 0 });
		flag_container.wrap(PageContainer.blotName, { key: flag_container.key, level: flag_container.level });
		flag_container.parent.appendChild(moveBlot);
		this.scroll.appendChild(flag_container.parent);
		// this.HeaderAndFooter.copyHeaderOrFooter();
	}

	moveContentToNext(moveBlot) {
		let theFirstBlot = this.findFirstContentNode(this.next);
		this.next.insertBefore(moveBlot, theFirstBlot);
	}

	moveContentToPrev() {
		const pageContainerHeight = this.calPageContainerHeight();
		let thisContentHeight = 0;
		this.children.forEach(blot => {
			thisContentHeight += this.calLineHeight(blot.domNode);
		});
		let pendingMoveBlot = this.findFirstContentNode(this.next);
		if (pageContainerHeight - thisContentHeight > this.calLineHeight(pendingMoveBlot.domNode)) {
			this.appendChild(pendingMoveBlot);
			this.checkNextNoContent();
		}
	}

	calPageContainerHeight() {
		let pagePaddingTop = parseInt(this.domNode.style.paddingTop, 10);
		pagePaddingTop = isNaN(pagePaddingTop) ? 0 : pagePaddingTop;
		let pagePaddingBottom = parseInt(this.domNode.style.paddingBottom, 10);
		pagePaddingBottom = isNaN(pagePaddingBottom) ? 0 : pagePaddingBottom;
		return this.domNode.clientHeight - pagePaddingTop - pagePaddingBottom;
	}

	calLineHeight(domNode) {
		let marginTop = parseInt(domNode.style.marginTop, 10);
		marginTop = isNaN(marginTop) ? 0 : marginTop;
		let marginBottom = parseInt(domNode.style.marginBottom, 10);
		marginBottom = isNaN(marginBottom) ? 0 : marginBottom;
		return domNode.offsetHeight + marginBottom + marginTop;
	}

	checkNextNoContent() {
		if (this.next.hasNoContent()) {
			this.next.remove();
			this.HeaderAndFooter.checkPageNum();
			return true;
		}
		return false;
	}

	checkAndUpdatePagenum() {
		// if(!this.children.head.pagenum) {
		// 	let page = 0;
		// 	this.scroll.children.forEach(pageBlot => {
		// 		page++;
		// 		if(pageBlot === this) {
		// 			this.attachAttrsToFlag({pagenum: page});
		// 		}
		// 	})
		// }
	}

	// updatePageNum() {
	// 	let startIndex = 0, totalLength = this.scroll.children.length;
	// 	this.scroll.children.forEach(blot => {
	// 		let [pageNumBlot] = blot.descendants(PageNum);
	// 		startIndex++;
	// 		if (pageNumBlot) {
	// 			pageNumBlot.domNode.innerText = `${startIndex}/${totalLength}`;
	// 		}
	// 	});
	// }

	resetNextSelection() {
		const quill = this.quill;
		const range = quill.getSelection();
		const [blot] = quill.getLine(range.index);

		if (blot instanceof PageBreakFlag) {
			let selectionBlot;
			this.next.children.forEach(blot => {
				if (!selectionBlot && !~[...Object.keys(HEADER_FOOTER), PageBreakFlag.blotName].indexOf(blot.statics.blotName)) {
					selectionBlot = blot;
				}

			});

			let nextIndex = quill.getIndex(selectionBlot);
			quill.setSelection(nextIndex);
		}

	}

	findFirstContentNode(pageContainer) {
		let theFirstNode = null;
		pageContainer.children.forEach(b => {
			if (
				!['page-header', 'page-footer'].includes(b.statics.blotName)
				&& !theFirstNode
				&& !(b instanceof ContainerFlag)
			) {
				theFirstNode = b;
			}
		});
		return theFirstNode;
	}

	hasNoContent() {
		let children = 0, curBlot;
		this.children.forEach(b => {
			if (!['page-header', 'page-footer'].includes(b.statics.blotName)) {
				children++;
				curBlot = b;
			}
		});
		if (children === 1) {
			return true;
		}
		return false;
	}

	updatePaddingMargin(paddings) {
		this.domNode.style.padding = paddings;
		this.HeaderAndFooter.updateSizeAndPosition();
	}

}

PageContainer.tagName = 'DIV';
PageContainer.blotName = 'page-container';
PageContainer.className = 'ql-page-container';

PageContainer.DEFAULT_OPTION = {
	pagePadding: [editSize.padding_top, editSize.padding, editSize.padding_bottom, editSize.padding],
	pageSize: [editSize.width, editSize.height],
}

PageBreakFlag.requiredContainer = PageContainer;

export function isChildrenWorkOver(blot, isOver = true) {
	if (!isOver) return isOver;
	blot.children.forEach(childBlot => {
		if (!isOver) return;
		if (childBlot.statics.requiredContainer && !(childBlot.parent instanceof childBlot.statics.requiredContainer)) {
			isOver = false;
		}
		if (!isOver) return;
		if (childBlot instanceof OriginContainer) {
			if (childBlot.checkMerge()) {
				isOver = false;
			} else {
				isOver = isChildrenWorkOver(childBlot, isOver);
			}
		}
	});
	return isOver;
}

export default class PageBreak extends Module {
	static register() {
		Quill.register(PageContainer);
		Quill.register(PageBreakFlag);
		Object.values(HEADER_FOOTER).forEach(blot => {
			Quill.register(blot);
		});
	}

	static header_first = null;
	static header = null;
	static footer_first = null;
	static footer = null;

	static pageTotal = 0;
	editingDom = null;

	static pagePadding = [editSize.padding_top, editSize.padding, editSize.padding_bottom, editSize.padding];

	static initialHeaderFooter(data) {
		this.header = data.header || null;
		this.header_first = data.header_first || null;
		this.footer = data.footer || null;
		this.footer_first = data.footer_first || null;
	}

	static updatePageTotalAndIndex() {
		this.pageTotal = this.quill.scroll.children.length;
		let pageNum = 0;
		this.quill.scroll.children.forEach(blot => {
			pageNum++;
			blot.children.forEach(child => {
				if (child.statics.blotName === 'footer-page-num') {
					child.updateNum(`${pageNum}/${this.pageTotal}`);
				}
			});
		});
	}

	constructor(quill, options) {
		super(quill, options);
		PageBreak.quill = quill;
		const _this = this;
		quill.root.addEventListener('click', (event) => {
			let isInHeaderOrFooter = this.findEditingContentDom(event);
			if (!isInHeaderOrFooter && this.editingDom) {
				// 更新页眉页脚内容
				this.editingDom.setAttribute('contenteditable', false);
				// 首页不需要更新
				if (~['ql-header-first-wrapper', 'ql-page-header-first', 'ql-footer-first-wrapper'].indexOf(this.editingDom.className)) return;

				let editBlot = Quill.find(this.editingDom);
				let startIndex = this.quill.getIndex(editBlot) + 1;
				let endIndex = this.quill.getIndex(editBlot.next) - 1;
				let delta = this.quill.getContents(startIndex, endIndex - startIndex);

				quill.scroll.children.forEach(pageBlot => {

					pageBlot.HeaderAndFooter.updateHeaderOrFooterForOtherPages(editBlot, delta);

					pageBlot.children.forEach(child => {
						// 可自定义内容
						// if(this.editingDom && child.statics.blotName === 'edit-container') {
						// 	child.children.forEach(blot => {
						// 		if(blot.domNode.className === this.editingDom.className) {
						// 			blot.remove();
						// 		}
						// 	});

						// 	let cloneDomNode = this.editingDom.cloneNode(true);
						// 	let cloneBlot = quill.scroll.create(cloneDomNode);
						// 	child.insertBefore(cloneBlot, child.children.head);
						// 	blot.updatePageNum();
						// }
					});
				});
				this.editingDom = null;
			}
		});
		quill.root.addEventListener('dblclick', (event) => {
			let editingContentDom = this.findEditingContentDom(event);
			if (editingContentDom) {
				editingContentDom.setAttribute('contenteditable', true);
				this.editingDom = editingContentDom;
			}
		});


		const BACKSPACE = 'Backspace';
		const ENTER = 'Enter';

		quill.keyboard.addBinding(
			{ key: BACKSPACE },
			{
				offset: 0,
				collapsed: true
			},
			function pageBackspace(range, context) {
				const quill = _this.quill;
				let [prev] = quill.getLine(range.index);
				let [line] = quill.getLine(range.index - 1);
				const container = getContainer(line);
				const prevContainer = getContainer(prev);
				if (!(container instanceof PageContainer) || !(prevContainer instanceof PageContainer)) return true;

				if (
					line instanceof PageBreakFlag
					&& prevContainer.prev
				) {
					/** 光标定位至上一页末尾*/
					let tail = prevContainer.prev.children.tail;
					let prevIndex = quill.getIndex(tail);
					quill.setSelection(prevIndex + tail.length() - 1);
					if (prevContainer.hasNoContent()) {
						prevContainer.remove();
						// prevContainer.HeaderAndFooter.checkPageNum();
						return false;
					}
					// return false;
				}
				return true;
			}
		);

		let thisBinding = quill.keyboard.bindings[BACKSPACE].pop();
		quill.keyboard.bindings[BACKSPACE].splice(1, 0, thisBinding);
	}

	// skipStableContainer(prev) {
	// 	if (prev.parent) {
	// 		if (prev.parent.statics.blotName === 'edit-container') {
	// 			if (['page-header', 'page-footer'].includes(prev.parent.prev.container)) {
	// 				return prev.parent.parent.parent.prev;
	// 			}
	// 		} else {
	// 			return this.skipStableContainer(prev.parent)
	// 		}
	// 	}
	// 	return prev;
	// }

	// onlyOnePageLeft() {
	// 	let num = 0;
	// 	this.quill.scroll.children.forEach(blot => {
	// 		if (blot.statics.blotName === 'page-container') {
	// 			num++;
	// 		}
	// 	});

	// 	return !(num > 1);
	// }

	// findThePrevSelection(blot) {
	// 	let theLastChild = blot.parent.prev.children.head.next.domNode.lastChild;
	// 	let theLastBlot = Quill.find(theLastChild);
	// 	let theLastIndex = this.quill.getIndex(theLastBlot);
	// 	return theLastIndex;
	// }

	// isTheFirstPage(blot) {
	// 	return !blot.parent.prev;
	// }

	// resetSelection(curFlagBlot) {
	// 	let prevPageContainer = curFlagBlot.parent.prev;
	// 	let prevEditContainer;
	// 	prevPageContainer.children.forEach(blot => {
	// 		if (blot.statics.blotName === 'edit-container') {
	// 			prevEditContainer = blot;
	// 		}
	// 	});
	// 	let prevIndex = this.quill.getIndex(prevEditContainer.children.tail);
	// 	this.quill.setSelection(prevIndex);
	// }



	findEditingContentDom(event) {
		return event.path.find(dom => {
			return typeof dom.className === 'string'
				&& ([
					'ql-header-content-wrapper',
					'ql-footer-content-wrapper',
					'ql-header-first-wrapper',
					'ql-footer-first-wrapper',
					'ql-page-header',
					'ql-page-footer'
				].find(item => ~dom.className.indexOf(item))
				);
		});
	}

	genOnePage({ pageNum, index }) {
		const quill = this.quill;
		quill.updateContents(
			new Delta()
				.retain(index)
				.insert({
					'pagebreak-flag': {
						pagenum: pageNum
					}
				})
			,
			Quill.sources.USER
		);

	}

}

PageBreak.keyboardBindings = {};

function addPx(sizeArr) {
	sizeArr = Array.isArray(sizeArr) ? sizeArr : [sizeArr];
	return sizeArr.reduce((a, b) => `${a} ${b}px`, '');
}

function genId(str) {
	return `${str}_${Math.random().toString(32).slice(2, 6)}`;
}