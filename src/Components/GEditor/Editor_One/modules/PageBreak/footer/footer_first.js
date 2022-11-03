import Quill from 'quill';
import ImgForHeaderFooter from '../../../formats/imgForHeaderFooter';

import { 
	FOOTER_FIRST_BLOCK_BLOT_NAME,
	FOOTER_FIRST_IMG_BLOT_NAME,
	FOOTER_FIRST_CONTAINER_BLOT_NAME,
	FOOTER_FIRST_CHILD_BLOCK_BLOT_NAME
 } from '../../../formats/BLOT_NAMES';
import { editSize } from '../../../common';
import footer_first from '../../../images/banner_content.png';

const Container = Quill.import('blots/container');
const WrapperContainer = Quill.import('blots/wrapperContainer');
const Block = Quill.import('blots/block');
const BlockEmbed = Quill.import('blots/block/embed');

export class FooterFisrtWrapper extends WrapperContainer {
	static create(value) {
		let node = super.create();
		node.setAttribute('style', `position: absolute; bottom: 0; left: 0; width: 100%;`);
		node.setAttribute('contenteditable', false);
		return node;
	}

	static register() {
		Quill.register(FooterFirstContainer);
		Quill.register(FooterFirstBlock);
		Quill.register(FooterFirstChildBlock);
		Quill.register(FooterFrstImageBlot)
	}
}

FooterFisrtWrapper.blotName = 'pageattach-footer-first-wrapper';
FooterFisrtWrapper.tagName = 'DIV';
FooterFisrtWrapper.className = 'ql-footer-first-wrapper';

export class FooterFirstContainer extends Container {
	static create() {
		let node = super.create();
		node.setAttribute('style', 'height: 254px; position: relative;');
		return node;
	}
}

FooterFirstContainer.blotName = FOOTER_FIRST_CONTAINER_BLOT_NAME;
FooterFirstContainer.tagName = "DIV";

export class FooterFirstBlock extends Container {
	static create(val){
		let domNode = super.create();
		domNode.setAttribute('style', 'position: absolute; left: 0; top: 130px; width: 100%; word-break: break-all; color: #fff;');
		return domNode;
	}
}

FooterFirstBlock.blotName = FOOTER_FIRST_BLOCK_BLOT_NAME;
FooterFirstBlock.tagName = "DIV";
FooterFirstBlock.className = `ql-${FOOTER_FIRST_BLOCK_BLOT_NAME}`;

export class FooterFirstChildBlock extends Block {
	static create(val){
		let domNode = super.create();
		return domNode;
	}

}

FooterFirstChildBlock.blotName = FOOTER_FIRST_CHILD_BLOCK_BLOT_NAME;
FooterFirstChildBlock.tagName = "DIV";
FooterFirstChildBlock.className = `ql-${FOOTER_FIRST_CHILD_BLOCK_BLOT_NAME}`;

FooterFirstBlock.allowedChildren = [FooterFirstChildBlock];
FooterFirstChildBlock.requiredContainer = FooterFirstBlock;

export class FooterFrstImageBlot extends ImgForHeaderFooter {
	static create(val) {
		let node = super.create();
		node.setAttribute('src', val.url);
		node.setAttribute('style', `width: 100%; position: absolute; left: 0; bottom: 0; max-width: none;`);
		return node;
	}

	static value(node) {
		return {
			url: node.getAttribute('src')
		}
	}
}

FooterFrstImageBlot.blotName = FOOTER_FIRST_IMG_BLOT_NAME;
FooterFrstImageBlot.tagName = 'IMG';
FooterFrstImageBlot.className = `ql-${FOOTER_FIRST_IMG_BLOT_NAME}`;

FooterFisrtWrapper.allowedChildren = [FooterFirstContainer];
FooterFirstContainer.requiredContainer = FooterFisrtWrapper;

FooterFirstContainer.allowedChildren = [FooterFirstBlock, FooterFrstImageBlot];
FooterFirstBlock.requiredContainer = FooterFirstContainer;
FooterFrstImageBlot.requiredContainer = FooterFirstContainer;

export const changjiang_footer_first = [
	{name: FOOTER_FIRST_IMG_BLOT_NAME, value: { url: footer_first }},
	{name: FOOTER_FIRST_CHILD_BLOCK_BLOT_NAME}
]