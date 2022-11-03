import Quill from "quill";
import cloneDeep from 'lodash/cloneDeep';
import { genId } from '../common';
const Block = Quill.import('blots/block');
const Embed = Quill.import('blots/embed');

export default class ContainerFlag extends Block {
  static create (value = {}) {
    const node = super.create();
		node.setAttribute("style", "display: none; position: absolute; left: 0; top: -1px;");
		node.setAttribute("contenteditable", false);
		Object.entries(value).forEach(item => {
			node.setAttribute(`data-${item[0]}`, item[1]);
		});
		node.setAttribute(`data-prevlength`, 0);
		if(!node.hasAttribute('data-childlength')) {
			node.setAttribute(`data-childlength`, 0);
		}
		if(!node.hasAttribute('data-key')) {
			node.setAttribute(`data-key`, genId("flag"));
		}
    return node
  }


	static formats(domNode) {
		const formats = {}
		Object.entries(domNode.dataset).forEach(item => {
			formats[item[0]] = item[1];
		});
		return formats;
	}

	constructor(scroll, domNode, val) {
		super(scroll, domNode, val);
		if(domNode.hasAttribute(`data-container`)) {
			this.container = domNode.getAttribute(`data-container`);
		}
	}

	updateLength(len) {
		if(this.domNode.dataset.prevlength === this.domNode.dataset.childlength) {
			this.domNode.dataset.childlength = len;
		}
		this.domNode.dataset.prevlength = len;
	}

	updatePrevLength(len) {
		this.domNode.dataset.prevlength = len;
	}

	optimize(context) {

		let flagKey = this.domNode.dataset.key;
		let level = flagKey.split("-")[1];
		if(!level) {
			if(this.domNode.dataset.container === 'page-container') {
				this.domNode.dataset.key = `${flagKey}-0`;
			} else if(this.parent.prev){
				let parentLevel = +this.parent.prev.domNode.dataset.key.split("-")[1];
				let levelgap = +this.domNode.dataset.levelgap || 0;
				this.domNode.dataset.key = `${flagKey}-${parentLevel + levelgap + 1}`;
			}
		}
		super.optimize(context);
	}

}

ContainerFlag.blotName = "container-flag";
ContainerFlag.tagName = "p";
ContainerFlag.className = "ql-container-flag";