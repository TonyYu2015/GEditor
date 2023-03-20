import Quill from "quill";
import { HeaderAndFooter } from '../HeaderFooter/index';
import { editSize, genId } from "../../../common";
import ContainerWrapper from "../../FreeContainer/blots/containerWrapper";

import '../index.less';
import { CMD_TYPES, FUNCTION_NAMES } from "../../../consts";

class PageContainer extends ContainerWrapper {

	constructor(scroll, domNode, value = {}) {
		super(scroll, domNode, value);
		this.quill = Quill.find(scroll.domNode.parentNode);
		this.PageBreakModule = this.quill.getModule('pageBreak');
		const styleArr = [
			`min-height: ${PageContainer.DEFAULT_OPTION.pageSize[1]}px;`,
			`padding: ${this.PageBreakModule.PagePaddingManager.getPadding(value)};`,
			// `margin-bottom: ${PageContainer.DEFAULT_OPTION.pageGap}px;`,
			...(value.page_style ? value.page_style : [])
		];
		domNode.setAttribute('style', styleArr.reduce((a, b) => a + ` ${b}`));
		this.quill.resizeObserver.addBlot(this, (entry) => {
			this.optimize();
		});
		this.HeaderAndFooter = new HeaderAndFooter({ pageBlot: this, quill: this.quill });
	}

	get pagenum() {
		return this.PageBreakModule.getPageNum(this);
	}

	optimize() {
		super.optimize();
		const quill = this.quill;
		if (quill.cmdType === CMD_TYPES.UNDO_REDO) {
			return;
		}
		this.attachPaddingToFlag();

		if (
			!quill.isLoadingRender
		) {
			const currentHeight = this.domNode.clientHeight;
			const defaultHeight = PageContainer.DEFAULT_OPTION.pageSize[1];
			if (this.domNode.style["overflow-y"] === "scroll") {
				let childHeight = 0;
				if (this.children.head) {
					childHeight = this.calLineHeight(this.children.head.domNode);
				}
				let pageContainerHeight = this.calPageContainerHeight(this.domNode);
				if (childHeight <= pageContainerHeight) {
					this.domNode.style["overflow-y"] = null;
					this.domNode.style["max-height"] = null;
					delete this._value.page_style;
					return;
				}
			}

			if (currentHeight > defaultHeight) {
				if (this.children.length === 1) {
					this.domNode.style["max-height"] = `${defaultHeight}px`;
					this.domNode.style["overflow-y"] = "scroll";
					this.attachAttrsToFlag({ page_style: [`max-height: ${defaultHeight}px;`, `overflow-y: scroll;`] });
					return;
				}

				let moveBlot = this.children.tail;
				let manager = quill.NestContainerManager;
				if (this.next?.statics?.blotName === PageContainer.blotName) {
					let theFirstBlot = this.next.children.head;
					if (moveBlot instanceof ContainerWrapper) {
						let nestData = manager.getNestDataByKey(moveBlot._value?.key);
						if (nestData) {
							// 更改父容器
							nestData.parentKey = this.next._value.key;
							this.next.insertBefore(moveBlot, theFirstBlot);

							// 从原页数据删除
							manager.removeNestDataByKey(nestData.key);

							// 删除受影响容器信息（由新插入页带入）
							manager.doRemoveNestData(nestData.key, manager.cacheNests);

							// 添加到新页
							manager.addNestDataByBlot(moveBlot, false, true);

							// 更新当前数据
							let newData = manager.getNestDataByKey(moveBlot._value?.key, true);
							moveBlot._value = { ...newData };
						}
					} else {
						this.next.insertBefore(moveBlot, theFirstBlot);

						// 需要重置索引
						manager.updateNestsIndexByBlot();
					}
				} else {

					// 撤销回退的时候，需要添加正确的页，并且将内容添加到合适位置
					if (quill.cmdType == CMD_TYPES.UNDO_REDO) {
						let range = { "startIndex": manager.getStartIndex(moveBlot), "endIndex": manager.getEndIndex(moveBlot) };
						let nestData = manager.getNestDataByRange(range);
						if (nestData?.key !== this._value?.key) {
							this.scroll.insertBefore(moveBlot, this.next);
							if (moveBlot.statics.blotName !== "page-container") {
								let blot = manager.getNestBlotByKey(nestData.key);
								if (blot) {
									blot.appendChild(moveBlot);
								} else {
									moveBlot.wrap(PageContainer.blotName, nestData);
								}
							}
						}
					} else {
						this.scroll.insertBefore(moveBlot, this.next);
						moveBlot.wrap(PageContainer.blotName, { "padding_top": 90, "padding_right": 60, "padding_bottom": 90, "padding_left": 60 });

						// 更新数据
						let pageContainer = moveBlot.getContainer(moveBlot);
						if (pageContainer) {
							// 如果是容器，需要数据上重置父容器，并从原位置删除数据
							if (moveBlot._value?.key) {
								moveBlot._value.parentKey = pageContainer._value.key;
								manager.removeNestDataByKey(moveBlot._value.key);
							}

							// 添加页数据
							manager.addNestDataByBlot(pageContainer);

							// 需要重置索引
							manager.updateNestsIndexByBlot();

							// 重新排序
							manager.NestContainer._children.sort((a, b) => {
								return a.startIndex - b.startIndex;
							})

						}
						this.next.HeaderAndFooter.copyHeaderOrFooter();
					}

				}

			} else if (this.next && this.next instanceof PageContainer) {
				this.moveContentToPrev();
			}
		}
	}

	remove() {
		if (!this.quill.isLoadingRender) {
			this.HeaderAndFooter.remove();
		}
		super.remove();
	}

	moveContentToPrev() {
		const pageContainerHeight = this.calPageContainerHeight();
		let thisContentHeight = 0;
		this.children.forEach(blot => {
			if (blot.statics.blotName === 'free-text') {
				return;
			}
			thisContentHeight += this.calLineHeight(blot.domNode);
		});
		let pendingMoveBlot = this.next.children.head;
		// thisContentHeight 为0时不做处理，比如退出研报编辑的时候
		if (pendingMoveBlot && thisContentHeight !== 0 && (pageContainerHeight - thisContentHeight > this.calLineHeight(pendingMoveBlot.domNode))) {
			this.appendChild(pendingMoveBlot);
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

	clearContent = () => {
		let firstBolt = this.children.head;
		let lastBlot = this.children.tail;
		while (firstBolt && lastBlot && firstBolt != lastBlot) {
			lastBlot.remove();
			lastBlot = this.children.tail;
		}
		firstBolt.remove();
		// 添加br,避免editContainer子对象为空，删除自身
		this.appendChild(this.scroll.create('block'));
	}

	attachPaddingToFlag() {
		this.attachAttrsToFlag({
			padding_top: parseInt(this.domNode.style.paddingTop, 10),
			padding_right: parseInt(this.domNode.style.paddingRight, 10),
			padding_bottom: parseInt(this.domNode.style.paddingBottom, 10),
			padding_left: parseInt(this.domNode.style.paddingLeft, 10),
		});
	}

	getPadding() {
		return [
			parseInt(this.domNode.style.paddingTop, 10),
			parseInt(this.domNode.style.paddingRight, 10),
			parseInt(this.domNode.style.paddingBottom, 10),
			parseInt(this.domNode.style.paddingLeft, 10)
		]
	}

	calPageContainerHeight() {
		let pagePaddingTop = parseInt(this.domNode.style.paddingTop, 10);
		pagePaddingTop = isNaN(pagePaddingTop) ? 0 : pagePaddingTop;
		let pagePaddingBottom = parseInt(this.domNode.style.paddingBottom, 10);
		pagePaddingBottom = isNaN(pagePaddingBottom) ? 0 : pagePaddingBottom;
		return PageContainer.DEFAULT_OPTION.pageSize[1] - pagePaddingTop - pagePaddingBottom;
	}
}

PageContainer.tagName = 'DIV';
PageContainer.blotName = 'page-container';
PageContainer.className = 'ql-page-container';

PageContainer.DEFAULT_OPTION = {
	pageSize: [editSize.width, editSize.height],
	pageGap: 20
}

export { PageContainer as default }