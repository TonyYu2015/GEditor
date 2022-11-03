
import Quill from 'quill';
import PageBreak from '../index';
import { editSize } from '../../../common';

const Container = Quill.import('blots/container');
const WrapperContainer = Quill.import('blots/wrapperContainer');
const Block = Quill.import('blots/block');
const Inline = Quill.import('blots/inline');
const BlockEmbed = Quill.import('blots/block/embed');

export class FooterContentWrapper extends WrapperContainer {
	static create(value) {
		let node = super.create();
		node.setAttribute('style', `position: absolute; height: ${PageBreak.pagePadding[2]}px; padding: 0 ${editSize.padding}px; bottom: 0; left: 0; width: 100%;`);
		node.setAttribute('contenteditable', false);
		return node;
	}

	static register() {
		Quill.register(FooterContentContainer);
		Quill.register(FooterContentBlock);
		Quill.register(FooterPageNum);
	}

	constructor(scroll, domNode, value) {
		super(scroll, domNode, value);
		this.height = PageBreak.pagePadding[2];
	}

	optimize(context) {
		super.optimize(context);
		if(this.height !== PageBreak.pagePadding[2]) {
			this.height = PageBreak.pagePadding[2];
			this.domNode.style.height = `${this.height}px`;
		}
	}
}

FooterContentWrapper.blotName = 'pageattach-footer-content-wrapper';
FooterContentWrapper.tagName = 'DIV';
FooterContentWrapper.className = 'ql-footer-content-wrapper';

export class FooterContentContainer extends Container {
	static create(value) {
		let node = super.create(value);
		node.setAttribute('style', 'height: 40px; position: relative; border-top: 3px solid #e84343;');
		if(value.style) {
			node.setAttribute('style', value.style);
		}
		return node;
	}
}

FooterContentContainer.blotName = 'footer-content-container';
FooterContentContainer.tagName = "DIV";
FooterContentContainer.className = "ql-footer-content-container";

export class FooterContentBlock extends Block {
	static create(val){
		let domNode = super.create(val);
		if(val.text) {
			domNode.innerText = val.text;
		}
		if(val.style) {
			domNode.style = val.style;
		}
		if(val.parentValue) {
			domNode.dataset.parentValue = typeof val.parentValue === 'string' ? val.parentValue : JSON.stringify(val.parentValue);
		}
		return domNode;
	}

	static formats(domNode) {
		return {
			style: domNode.getAttribute('style'),
			parentValue: domNode.dataset.parentValue
		}
	}

	optimize(context) {
    if (
			this.statics.requiredContainer &&
      !(this.parent instanceof this.statics.requiredContainer)
		) {
			const parentValue = this.domNode.dataset.parentValue;
      this.wrap(this.statics.requiredContainer.blotName, JSON.parse(parentValue));
    }
    super.optimize(context)
	}
}

FooterContentBlock.blotName = 'footer-content-block';
FooterContentBlock.tagName = "DIV";
FooterContentBlock.className = `ql-footer-content-block`;


export class FooterPageNum extends BlockEmbed {
	static create(val) {
		let domNode = super.create();
		domNode.setAttribute('style', 'position: absolute; right: 58px; top: 3px;');
		if(val.num) {
			domNode.innerText = val.num;
		}
		return domNode;
	}

	static value(domNode) {
		return {
			num: domNode.innerText
		}
	}

	updateNum(numStr) {
		this.domNode.innerText = numStr;
	}
}

FooterPageNum.blotName = 'footer-page-num';
FooterPageNum.tagName = 'SPAN';
FooterPageNum.className = 'ql-footer-page-num';

FooterContentWrapper.allowedChildren = [FooterContentContainer, FooterPageNum];
FooterContentContainer.requiredContainer = FooterContentWrapper;
FooterPageNum.requiredContainer = FooterContentWrapper;

FooterContentContainer.allowedChildren = [FooterContentBlock];
FooterContentBlock.requiredContainer = FooterContentContainer;

export const changjiang_footer = [
	{name: 'footer-page-num'},
	{name: 'footer-content-block'}
];