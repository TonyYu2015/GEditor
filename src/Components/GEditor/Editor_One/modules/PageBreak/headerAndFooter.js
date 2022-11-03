import Quill from "quill";
import PageHeader from './blots/pageHeader';
import PageHeaderFirst from './blots/pageHeaderFirst';
import PageFooter, { PageNum } from './blots/pageFooter';

export const HEADER_FOOTER = {
	[PageHeader.blotName]: PageHeader,
	[PageFooter.blotName]: PageFooter,
	[PageHeaderFirst.blotName]: PageHeaderFirst,
}

const Delta = Quill.import('delta');

export default class HeaderAndFooter {
	constructor({pageBlot, quill}) {
		this.pageBlot = pageBlot;
		this.quill = quill;
	}

	updateSizeAndPosition() {
		let pageBlot = this.pageBlot;
		const arr = Object.values(HEADER_FOOTER).reduce((blotarr, blotConstructor) => {
			return blotarr.concat(pageBlot.descendants(blotConstructor));
		}, []);

		arr.forEach(blot => {
			blot.updatePosition();
		})
	}

	/**
	 * 页眉页脚操作 
	 */
	pageAttachOperation({ blotName, operation, delta }) {
		const pageBlot = this.pageBlot;
		const quill = this.quill;
		let editContainer = pageBlot.children.tail;
		let isReplace = true;
		editContainer.children.forEach(b => {
			if (b instanceof PageHeaderFirst && blotName === PageHeader.blotName) {
				isReplace = false;
			} else if (blotName.indexOf(b.statics.blotName) === 0) {
				b.remove();
			}
		});
		pageBlot.scroll.update();

		if (!isReplace) return;
		if (operation === 'remove') {
			pageBlot.updateHeader();
			pageBlot.updateFooter();
			/**
			 * 移除首页页眉或页脚时需要检查是否有普通页眉或页脚，有则插入进首页
			 */
			if(!pageBlot.next) return;
			let BlotConstruntor;
			if (PageHeaderFirst.blotName === blotName) {
				BlotConstruntor = PageHeader;
			}

			if (BlotConstruntor) {
				const [blot] = pageBlot.next.descendants(BlotConstruntor);
				if (blot) {
					let startIndex = quill.getIndex(blot) + 1;
					let endIndex =quill.getIndex(blot.next) - 1;
					let delta = quill.getContents(startIndex, endIndex - startIndex);

					this.insertHeaderOrFooter(BlotConstruntor.blotName);
					this.addCustomHeaderOrFooter(delta, BlotConstruntor.blotName);
				}
			}
			return;
		}

		this.insertHeaderOrFooter(blotName);
		if (delta) {
			this.addCustomHeaderOrFooter(delta, blotName);
		}
	}
	/**
	 * 插入页眉或页脚 
	 */
	insertHeaderOrFooter(blotName) {
		/**
		 * 使用delta操作,插入空白页眉页脚
		 */
		let head = this.pageBlot.children.tail.children.head;
		let headIndex = this.quill.getIndex(head);
		const newDelta = new Delta()
			.retain(headIndex)
			.insert({ 'container-flag': { container: blotName, } });

		this.quill.updateContents(newDelta);
	}

	/**
	 * 插入定制页眉页脚内容
	 */
	addCustomHeaderOrFooter(delta, blotName) {
		let [target] = this.pageBlot.descendants(HEADER_FOOTER[blotName]);
		let startIndex = this.quill.getIndex(target) + 1;

		this.quill.updateContents(
			new Delta()
				.retain(startIndex)
				.concat(new Delta(delta))
		);
	}

	/**
	 * 新增一页时复制页眉或页脚
	 */
	copyHeaderOrFooter() {
		const pageBlot = this.pageBlot;
		const quill = this.quill;
		const [header] = pageBlot.descendants(PageHeader);
		const [footer] = pageBlot.descendants(PageFooter);

		if (header && header.statics.blotName === PageHeader.blotName) {
			let startIndex = quill.getIndex(header) + 1;
			let endIndex = quill.getIndex(header.next) - 1;
			let delta = quill.getContents(startIndex, endIndex - startIndex);

			pageBlot.next.HeaderAndFooter.insertHeaderOrFooter(PageHeader.blotName);
			pageBlot.next.HeaderAndFooter.addCustomHeaderOrFooter(delta, PageHeader.blotName);
		}
		if (footer && footer.statics.blotName === PageFooter.blotName) {
			let startIndex = quill.getIndex(footer) + 1;
			let endIndex = quill.getIndex(footer.next) - 1;
			let delta = quill.getContents(startIndex, endIndex - startIndex);

			pageBlot.next.HeaderAndFooter.insertHeaderOrFooter(PageFooter.blotName);
			pageBlot.next.HeaderAndFooter.addCustomHeaderOrFooter(delta, PageFooter.blotName);
			this.checkPageNum();
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

	updateHeaderOrFooterForOtherPages(blot, delta) {
		let [target] = this.pageBlot.descendants(blot.constructor);
		if (!target) return;
		let startIndex = this.quill.getIndex(target) + 1;
		let endIndex = this.quill.getIndex(target.next) - 1;
		let newDelta = new Delta()
			.retain(startIndex)
			.delete(endIndex - startIndex)
			.concat(delta);

		this.quill.updateContents(newDelta);
	}
}