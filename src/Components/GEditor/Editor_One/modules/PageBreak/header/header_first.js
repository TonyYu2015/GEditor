import Quill from 'quill';
import ImgForHeaderFooter from '../../../formats/imgForHeaderFooter';
import PageBreak from '../index';

import { 
	HEADER_FIRST_BLOCK_BLOT_NAME,
	HEADER_FIRST_CONTAINER_BLOT_NAME,
	HEADER_FIRST_IMG_BLOT_NAME
 } from '../../../formats/BLOT_NAMES';
import { editSize } from '../../../common';
import header_first from '../../../images/banner_first.png';

const Container = Quill.import('blots/container');
const WrapperContainer = Quill.import('blots/wrapperContainer');
const Block = Quill.import('blots/block');
const BlockEmbed = Quill.import('blots/block/embed');

export class HeaderFisrtWrapper extends WrapperContainer {
	static create(value) {
		let node = super.create();
		// node.setAttribute('style', `position: absolute; height: ${PageBreak.pagePadding[0]}px; padding: 0 ${editSize.padding}px; top: 0; left: 0; width: 100%;`);
		node.setAttribute('style', `position: absolute; height: 50px; padding: 0 ${editSize.padding}px; top: 0; left: 0; width: 100%;`);
		node.setAttribute('contenteditable', false);
		return node;
	}

	constructor(scroll, domNode, value) {
		super(scroll, domNode, value);
		this.height = PageBreak.pagePadding[0];
	}

	static register() {
		Quill.register(HeaderFisrtContainer);
		Quill.register(HeaderFirstBlock);
		Quill.register(HeaderFirstImg);
	}

	optimize(context) {
		super.optimize(context);
		if(this.height !== PageBreak.pagePadding[0]) {
			this.height = PageBreak.pagePadding[0];
			this.domNode.style.height = `${this.height}px`;
		}
	}
}

HeaderFisrtWrapper.blotName = 'pageattach-header-first-wrapper';
HeaderFisrtWrapper.tagName = 'DIV';
HeaderFisrtWrapper.className = 'ql-header-first-wrapper';

export class HeaderFisrtContainer extends Container {
	static create() {
		let node = super.create();
		node.setAttribute('style', 'position: relative; height: 100%;');
		return node;
	}
}

HeaderFisrtContainer.blotName = HEADER_FIRST_CONTAINER_BLOT_NAME;
HeaderFisrtContainer.tagName = "DIV";

export class HeaderFirstBlock extends Block {
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

HeaderFirstBlock.blotName = HEADER_FIRST_BLOCK_BLOT_NAME;
HeaderFirstBlock.tagName = "DIV";
HeaderFirstBlock.className = `ql-${HEADER_FIRST_BLOCK_BLOT_NAME}`;

export class HeaderFirstImg extends ImgForHeaderFooter {
	static create(val) {
		let node = super.create(val);
		node.setAttribute('style', 'width: 100%; position: absolute; left: 0; top: 0;');
		node.src = val.url;
		// node.setAttribute('src', val.url);
		if(val.style) {
			node.setAttribute('style', val.style);
		}
		return node;
	}

	static value(node) {
		return {
			url: node.getAttribute('src'),
			style: node.getAttribute('style')
		}
	}
}

HeaderFirstImg.blotName = HEADER_FIRST_IMG_BLOT_NAME;
HeaderFirstImg.tagName = 'IMG';
HeaderFirstImg.className = `ql-${HEADER_FIRST_IMG_BLOT_NAME}`;

HeaderFisrtWrapper.allowedChildren = [HeaderFisrtContainer];
HeaderFisrtContainer.requiredContainer = HeaderFisrtWrapper;

HeaderFisrtContainer.allowedChildren = [HeaderFirstBlock, HeaderFirstImg];
HeaderFirstBlock.requiredContainer = HeaderFisrtContainer;
HeaderFirstImg.requiredContainer = HeaderFisrtContainer;

export const changjiang_header_first = [
	{name: HEADER_FIRST_IMG_BLOT_NAME, value: { url: header_first }},
	{name: HEADER_FIRST_BLOCK_BLOT_NAME}
]