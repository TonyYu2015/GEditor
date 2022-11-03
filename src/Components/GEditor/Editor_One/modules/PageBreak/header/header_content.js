import Quill from 'quill';
import ImgForHeaderFooter from '../../../formats/imgForHeaderFooter';
import PageBreak from '../index';

import { 
	HEADER_CONTENT_BLOCK_BLOT_NAME,
	HEADER_CONTENT_CONTAINER_BLOT_NAME,
	HEADER_CONTENT_IMG__BLOT_NAME
 } from '../../../formats/BLOT_NAMES';
import { editSize } from '../../../common';
import header_content from '../../../images/header_content.png';

const Container = Quill.import('blots/container');
const WrapperContainer = Quill.import('blots/wrapperContainer');
const Block = Quill.import('blots/block');
const BlockEmbed = Quill.import('blots/block/embed');
const Delta = Quill.import('delta');

export class HeaderContentWrapper extends WrapperContainer {
	static create(value) {
		let node = super.create();
		node.setAttribute('style', `position: absolute; height: ${PageBreak.pagePadding[0]}px; padding: 0 ${editSize.padding}px; top: 0; left: 0; width: 100%;`);
		node.setAttribute('contenteditable', false);
		return node;
	}

	constructor(scroll, domNode, value) {
		super(scroll, domNode, value);
		this.height = PageBreak.pagePadding[0];
	}

	optimize(context) {
		super.optimize(context);
		if(this.height !== PageBreak.pagePadding[0]) {
			this.height = PageBreak.pagePadding[0];
			this.domNode.style.height = `${this.height}px`;
		}
	}

	static register() {
		Quill.register(HeaderContentBlock);
		Quill.register(HeaderContentImageBlot);
		Quill.register(HeaderContentContainer);
	}
}

HeaderContentWrapper.blotName = 'pageattach-header-content-wrapper';
HeaderContentWrapper.tagName = 'DIV';
HeaderContentWrapper.className = 'ql-header-content-wrapper';

export class HeaderContentContainer extends Container {
	static create() {
		let node = super.create();
		node.setAttribute('style', 'position: relative; height: 100%;');
		return node;
	}

}

HeaderContentContainer.blotName = HEADER_CONTENT_CONTAINER_BLOT_NAME;
HeaderContentContainer.tagName = "DIV";
HeaderContentContainer.className = `ql-${HEADER_CONTENT_CONTAINER_BLOT_NAME}`;

export class HeaderContentBlock extends Block {
	// static create(val){
	// 	let domNode = super.create();
	// 	domNode.setAttribute('style', 'position: absolute; left: 16px; top: 7px; width: 100%; color: #fff;');
	// 	return domNode;
	// }

	static create(val){
		let domNode = super.create();
		domNode.setAttribute('style', 'position: absolute; left: 23px; top: 31px; width: 100%;');
		if(val.style) {
			domNode.setAttribute('style', val.style);
		}
		if(val.text) {
			domNode.innerText = val.text;
		}
		return domNode;
	}

	static formats(domNode) {
		return {
			style: domNode.getAttribute('style')
		}
	}
}

HeaderContentBlock.blotName = HEADER_CONTENT_BLOCK_BLOT_NAME;
HeaderContentBlock.tagName = "DIV";
HeaderContentBlock.className = `ql-${HEADER_CONTENT_BLOCK_BLOT_NAME}`;

export class HeaderContentImageBlot extends ImgForHeaderFooter {
	static create(val) {
		let node = super.create(val);
		node.setAttribute('style', `width: 130px; position: absolute; left: ${PageBreak.pagePadding[3]}px; bottom: 0;`);
		node.setAttribute('src', val.url);
		if(val.style) {
			node.setAttribute('style', val.style);
		}
		return node;
	}

	static value(node) {
		return {
			url: node.getAttribute('src')
		}
	}
}

HeaderContentImageBlot.blotName = HEADER_CONTENT_IMG__BLOT_NAME;
HeaderContentImageBlot.tagName = 'IMG';
HeaderContentImageBlot.className = `ql-${HEADER_CONTENT_IMG__BLOT_NAME}`;

HeaderContentWrapper.allowedChildren = [HeaderContentContainer, HeaderContentImageBlot];
HeaderContentContainer.requiredContainer = HeaderContentWrapper;
HeaderContentImageBlot.requiredContainer = HeaderContentWrapper;

HeaderContentContainer.allowedChildren = [HeaderContentBlock];
HeaderContentBlock.requiredContainer = HeaderContentContainer;

export const changjiang_header = [
	{name: HEADER_CONTENT_IMG__BLOT_NAME, value: { url: header_content }},
	{name: HEADER_CONTENT_BLOCK_BLOT_NAME}
]