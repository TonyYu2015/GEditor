import Quill from "quill";
import HeaderAndFooter, { HEADER_FOOTER } from "./headerAndFooter";
import { editSize } from '../../common';
import * as initialDeltaData from './header_footer_initial_delta_data';
import * as headerFooterContainer from './header_footer_container';

import { HeaderFisrtWrapper } from './header/header_first';
import { HeaderContentWrapper } from './header/header_content';
import { FooterContentWrapper, FooterPageNum } from './footer/footer_content';

// import { PageNum } from './blots/pageFooter';
import CUSTOMIZE_CONTENT from './customize';

const Delta = Quill.import('delta');
const Module = Quill.import('core/module');
const Container = Quill.import("blots/outerContainer");
const Break = Quill.import("blots/break");
const OriginContainer = Quill.import('blots/container');
const EditContainer = Quill.import('blots/editContainer');
const ContainerFlag = Quill.import('blots/containerFlag');

export class PageContainer extends Container {
	static create(value) {
		let domNode = super.create(value);
		const styleArr = [
			`width: 100%;`,
			`position: relative;`,
			`min-height: ${PageContainer.DEFAULT_OPTION.pageSize[1]}px;`,
			// `height: ${PageContainer.DEFAULT_OPTION.pageSize[1]}px;`,
			`padding: ${addPx(PageBreak.pagePadding)};`,
			// `border: 1px solid #eee;`,
			`background: #fff;`,
			`margin-bottom: ${PageContainer.DEFAULT_OPTION.pageGap}px;`,
		]
		domNode.setAttribute('style', styleArr.reduce((a, b) => a + ` ${b}`));
		return domNode;
	}

	constructor(scroll, domNode, value) {
		super(scroll, domNode, value);
		this.value = value;
		this.quill = Quill.find(scroll.domNode.parentNode);
		this.HeaderAndFooter = new HeaderAndFooter({pageBlot: this, quill: this.quill});
	}

	getHeaderFooter(pageBlot) {
		let header = null, footer = null, newHeader = null, newFooter = null;
		pageBlot.children.forEach(blot => {
			// 页眉
			if (blot instanceof headerFooterContainer.HeaderContentWrapper) {
				let cloneNode = blot.domNode.cloneNode(true);
				header = this.scroll.create(cloneNode);
			}
			// 页脚
			if (blot instanceof headerFooterContainer.FooterContentWrapper) {
				let cloneNode = blot.domNode.cloneNode(true);
				footer = this.scroll.create(cloneNode);
			}
		});

		return [header, footer, newHeader, newFooter];
	}

	updateHeader(header) {
		// 移除当前页眉
		let curFooter = null;
		this.children.forEach(childBlot => {
			if (~childBlot.statics.blotName.indexOf('header')) {
				childBlot.remove();
			}
			if (~childBlot.statics.blotName.indexOf('footer')) {
				curFooter = childBlot;
			}
		});

		if (!header) return;
		const deltaData = initialDeltaData[header];
		deltaData.forEach(delta => {
			const blot = this.scroll.create(delta.name, delta.value || {});
			this.insertBefore(blot, curFooter);
		});
	}

	updateFooter(footer) {
		// 移除当前页脚
		this.children.forEach(childBlot => {
			if (~childBlot.statics.blotName.indexOf('footer')) {
				childBlot.remove();
			}
		});

		if (!footer) return;
		const deltaData = initialDeltaData[footer];
		deltaData.forEach(delta => {
			const blot = this.scroll.create(delta.name, delta.value || {});
			this.appendChild(blot);
		});
		PageBreak.updatePageTotalAndIndex();
	}

	addStyleToEdit() {
		const editContainer = this.children.tail;
		if (editContainer && !editContainer.domNode.getAttribute('style')) {
			editContainer.domNode.setAttribute('style', 'position: relative;');
		}
	}


	adjustPageFooterPosition() {
		if (this.height !== this.domNode.clientHeight) {
			this.height = this.domNode.clientHeight;
			let blot = this.children.tail.children.head;
			while (blot) {
				if (blot.statics.blotName === 'page-footer') {
					blot.updatePosition();
					break;
				}
				blot = blot.next;
			}
		}
	}

	updateIndicator() {
		// 新建模板时刷新函数指标
		if (this.scroll.reportInfo.isTemplateDelta && this.scroll.reportInfo.new && !this.next) {
			let refreshModule = quill.getModule("refresh");
			refreshModule.refreshAll();
			this.scroll.reportInfo.new = false;
		}
	}

	// paging() {
	optimize() {
		super.optimize();
		const quill = Quill.find(this.scroll.domNode.parentNode);
		if (
			quill
			&& this.children.head
		) {
			const editContainer = this.children.head.next;
			const pageSizeOption = PageContainer.DEFAULT_OPTION;
			if (editContainer && !editContainer.domNode.getAttribute('style')) {
				editContainer.domNode.setAttribute('style', `position: relative;`);
			}
			if (editContainer && isChildrenWorkOver(editContainer) && !quill.isLoadingRender) {
				this.checkAndUpdatePagenum();
				const editorHeight = editContainer.domNode.offsetHeight;
				const pageContainerHeight = pageSizeOption.pageSize[1] - PageBreak.pagePadding[0] - PageBreak.pagePadding[2] - 2;
				if (
					editorHeight > pageContainerHeight
					// false
					// && (editorHeight - pageContainerHeight) <= 18 
					// && this.scroll.keyBoardAction === 'enter'
				) {
					let moveBlot = Quill.find(editContainer.domNode.lastChild);
					if (moveBlot.domNode.offsetHeight > pageContainerHeight) {
						if (editContainer.children.length === 1) {
							editContainer.appendChild(this.scroll.create('block'));
						}
						moveBlot.remove();
						console.warn('单个元素高度不能超过页面高度!!!');
						return;
					}
					if (!this.next || this.next.statics.blotName !== PageContainer.blotName) {
						const flag_container = this.scroll.create('container-flag', { container: PageContainer.blotName, pagenum: this.scroll.children.length + 1 });
						flag_container.wrap(PageContainer.blotName, { key: flag_container.domNode.dataset.key });
						moveBlot.wrap('edit-container');
						flag_container.parent.appendChild(moveBlot.parent);
						/**添加页眉和页脚
						 * 非首页则复制上页页眉页脚包括自定义内容
						 */
						if (this.scroll.children.length > 0) {
							let [header, footer] = this.getHeaderFooter(this);
							if (header) {
								flag_container.parent.appendChild(header);
							}
							if (footer) {
								flag_container.parent.appendChild(footer);
							}
						}
						this.scroll.appendChild(flag_container.parent);
						this.HeaderAndFooter.copyHeaderOrFooter();
						// PageBreak.updatePageTotalAndIndex();
					} else {
						let editorContainer = this.next.children.head.next;
						let theFirstBlot = this.findFirstContentNode(editorContainer);
						editorContainer.insertBefore(moveBlot, theFirstBlot);
					}
					if (this.scroll.keyBoardAction === 'enter') {
						setTimeout(this.resetNextSelection.bind(this));
					}
				} else if (
					editorHeight < pageContainerHeight
					&& (pageContainerHeight - editorHeight) > 18
					&& this.next instanceof Container
					&& this.scroll.keyBoardAction === 'backspace'
				) {
					let thisEditorContainer = this.children.head.next;
					let nextEditorContainer = this.next.children.head.next;
					if (nextEditorContainer) {
						let theMoveBlot = this.findFirstContentNode(nextEditorContainer);
						if (theMoveBlot) {
							if ((editorHeight + theMoveBlot.domNode.clientHeight) > pageContainerHeight) return;
							thisEditorContainer.appendChild(theMoveBlot);
						}
						if (this.next.hasNoContent()) {
							this.next.remove();
							this.HeaderAndFooter.checkPageNum();
							// PageBreak.updatePageTotalAndIndex();
						}
					}
				}
			}
		}
	}

	checkAndUpdatePagenum() {
		if(!this.children.head.domNode.dataset.pagenum) {
			let page = 0;
			this.scroll.children.forEach(pageBlot => {
				page++;
				if(pageBlot === this) {
					this.attachAttrsToFlag({pagenum: page});
				}
			})
		}
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
		// if (blot.getContainer) {
		// 	const curBlotContainer = blot.getContainer(blot);
		// 	if (
		// 		!(curBlotContainer instanceof PageContainer) ||
		// 		(curBlotContainer.children.head.next === this.children.head.next)
		// 	) return;
		// }

		if(blot instanceof ContainerFlag && blot.parent instanceof PageContainer) {
			const [nextEditContainer] = this.next.descendants(EditContainer);
			let selectionBlot;
			nextEditContainer.children.forEach(blot => {
				if (!selectionBlot && !~[...Object.keys(HEADER_FOOTER), ContainerFlag.blotName].indexOf(blot.statics.blotName)) {
					selectionBlot = blot;
				}

			});

			let nextIndex = quill.getIndex(selectionBlot);
			quill.setSelection(nextIndex);
		}

	}

	findFirstContentNode(editContainer) {
		let theFirstNode = null;
		editContainer.children.forEach(b => {
			if (!['page-header', 'page-footer'].includes(b.statics.blotName) && !theFirstNode) {
				theFirstNode = b;
			}
		});
		return theFirstNode;
	}

	// checkScrollChildren() {
	// 	this.scroll.children.forEach(child => {
	// 		if (child.statics.blotName !== PageContainer.blotName) {
	// 			child.remove();
	// 		}
	// 	});
	// }

	hasNoContent() {
		let children = 0, curBlot;
		const editBlot = this.children.head.next;
		editBlot.children.forEach(b => {
			if (!['page-header', 'page-footer'].includes(b.statics.blotName)) {
				children++;
				curBlot = b;
			}
		});
		if (children === 0 || (children === 1 && curBlot.children.head instanceof Break)) {
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
	pageGap: 20
}

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
		Object.values(HEADER_FOOTER).forEach(blot => {
			Quill.register(blot);
		});
		Object.values(headerFooterContainer).forEach(blot => {
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
				} else if (child.statics.blotName === 'pageattach-footer-content-wrapper') {
					let [pageBlot] = child.descendant(FooterPageNum);
					pageBlot.updateNum(`${pageNum}/${this.pageTotal}`);
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
						// 旧版定制
						if (this.editingDom && (this.editingDom.className === child.domNode.className)) {
							let theDomNode =
								this.editingDom.querySelector('.ql-footer-content-container') ||
								this.editingDom.querySelector('.ql-contentHeaderContainer');
							let cloneDomNode = theDomNode.cloneNode(true);
							let cloneBlot = quill.scroll.create(cloneDomNode);
							child.children.forEach(item => {
								if (item.domNode.className === theDomNode.className) {
									child.insertBefore(cloneBlot, item.next);
									item.remove();
								}
							})
						}
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
				const container = line.getContainer && line.getContainer(line);
				const prevContainer = prev.getContainer && prev.getContainer(prev);

				if((
					container
					&& ~Object.keys(HEADER_FOOTER).indexOf(container.statics.blotName)
					|| (line.statics.blotName === ContainerFlag.blotName && line.parent instanceof PageContainer)
					) 
					&& prevContainer.prev
				) {
					// 光标定位至上一页末尾
					let [prevEditContainer] = prevContainer.prev.descendants(EditContainer);
					let tail = prevEditContainer.children.tail;
					let prevIndex = quill.getIndex(tail);
					quill.setSelection(prevIndex + tail.length() - 1);
					// return false;
				}

				// if (!(container instanceof PageContainer)) return true;

				// if (!['container-flag'].includes(prev.statics.blotName)) {
				// 	prev = _this.skipStableContainer(prev);
				// }
				// if (['container-flag'].includes(prev.statics.blotName)) {
				// 	if (prev.domNode.dataset.container === 'page-container') {
				// 		if (_this.isTheFirstPage(prev)) return false;
				// 		_this.resetSelection(prev);
				// 		if (container.hasNoContent()) {
				// 			let prevPageContainer = container.prev;
				// 			container.remove();
				// 			prevPageContainer.updatePageNum();
				// 			PageBreak.updatePageTotalAndIndex();
				// 		}
				// 	}
				// 	return false;
				// }
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



	updatePagePadding(pagePadding) {
		PageBreak.pagePadding = pagePadding;
		let paddings = addPx(pagePadding);
		this.quill.scroll.children.forEach(blot => {
			if (blot instanceof PageContainer) {
				// blot.PageMargins.update(paddings);
				blot.updatePaddingMargin(paddings);
				let headerDescendant = blot.descendants(HeaderFisrtWrapper);
				let headerContentDescendant = blot.descendants(HeaderContentWrapper);
				let footerDescendant = blot.descendants(FooterContentWrapper);
				headerDescendant.forEach(b => {
					b.optimize();
				});
				footerDescendant.forEach(b => {
					b.optimize();
				});
				headerContentDescendant.forEach(b => {
					b.optimize();
				});

			}
		});
		this.quill.scroll.children.head.optimize();
	}

	updateHeaderOrFooter(type) {
		const typeArr = type.split('-');
		PageBreak[typeArr[1]] = typeArr[2] || null;

		const scroll = this.quill.scroll;
		switch (typeArr[1]) {
			case 'header_first':
				scroll.children.head.updateHeader(PageBreak.header_first);
				break;
			case 'header':
				scroll.children.forEach((pageBlot) => {
					if (PageBreak.header_first && !pageBlot.prev) return;
					pageBlot.updateHeader(PageBreak.header);
				});
				break;
			case 'footer_first':
				scroll.children.head.updateFooter(PageBreak.footer_first);
				break;
			case 'footer':
				scroll.children.forEach((pageBlot) => {
					if (PageBreak.footer_first && !pageBlot.prev) return;
					pageBlot.updateFooter(PageBreak.footer);
				});
				break;
			/**
			 * 新版 
			 */
			case 'header_normal_first':
				scroll.children.head.HeaderAndFooter.pageAttachOperation({ blotName: 'page-header-first', delta: CUSTOMIZE_CONTENT[`${typeArr[2]}_header`] });
				break;
			case 'header_first_remove':
				scroll.children.head.HeaderAndFooter.pageAttachOperation({ blotName: 'page-header-first', operation: 'remove' });
				break;
			case 'header_normal':
				scroll.children.forEach((pageBlot) => {
					pageBlot.HeaderAndFooter.pageAttachOperation({ blotName: 'page-header', delta: CUSTOMIZE_CONTENT[`${typeArr[2]}_header`] });
				});
				break;
			case 'header_remove':
				scroll.children.forEach((pageBlot) => {
					pageBlot.HeaderAndFooter.pageAttachOperation({ blotName: 'page-header', operation: 'remove' });
				});
				break;
			case 'footer_normal':
				scroll.children.forEach((pageBlot) => {
					pageBlot.HeaderAndFooter.pageAttachOperation({ blotName: 'page-footer', delta: CUSTOMIZE_CONTENT[`${typeArr[2]}_footer`] });
				});
				break;
			case 'footer_remove':
				scroll.children.forEach((pageBlot) => {
					pageBlot.HeaderAndFooter.pageAttachOperation({ blotName: 'page-footer', operation: 'remove' });
				});
				break;
			default:
				throw new Error('must give a name!');
		}
	}


	addNewPage() {
		this.genOnePage();
	}

	genOnePage() {
		const quill = this.quill;

		quill.setContents(
			new Delta()
				.retain(0)
				.insert({
					'container-flag': {
						container: PageContainer.blotName,
						pagenum: 1
					}
				}),
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