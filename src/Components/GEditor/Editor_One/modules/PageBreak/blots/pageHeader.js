import PageBreak from "../index";
import OuterContainer from "../../../blots/outerContainer";

export default class PageHeader extends OuterContainer {
	// 高度为页上边距,绝对定位附着于页面顶部
	constructor(scroll, domNode, value) {
		super(scroll, domNode, value);
		const styleArr = [
			`width: 100%;`,
			`position: absolute;`,
			`height: ${PageBreak.pagePadding[0]}px;`,
			`top: -${PageBreak.pagePadding[0]}px;`,
			`left: -${PageBreak.pagePadding[3]};`
		]
		domNode.setAttribute('style', styleArr.reduce((a, b) => a + ` ${b}`));
		domNode.setAttribute('contenteditable', false);
	}

	updatePosition() {
		let editContainer = this.parent;
		let pageContainer = editContainer.parent;
		let topAndHeight = parseInt(pageContainer.domNode.style.paddingTop);
		if(this.children.head && parseInt(this.domNode.style.top) !== topAndHeight) {
			this.domNode.style.top = `-${topAndHeight}px`;
			this.attachAttrsToFlag({top: topAndHeight});
		}

		if(this.children.head && parseInt(this.domNode.style.height) !== topAndHeight) {
			this.domNode.style.height = `${topAndHeight}px`;
			this.attachAttrsToFlag({heigt: topAndHeight});
		}
	}
}

PageHeader.blotName = 'page-header';
PageHeader.tagName = 'DIV';
PageHeader.className = 'ql-page-header';