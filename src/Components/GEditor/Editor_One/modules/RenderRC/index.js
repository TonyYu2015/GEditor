import Quill from "quill";
import { genId } from "../../common";
import renderReactComponent from '../../components/TemplateComponents';

// const Embed = Quill.import('blots/embed');
const BlockEmbed = Quill.import('blots/block/embed');
const Module = Quill.import('core/module');
const WrapperContainer = Quill.import('blots/wrapperContainer');

export class RCContainer extends WrapperContainer {

	static create(val) {
		let domNode = super.create();
		domNode.setAttribute('style', 'position: relative;');
		return domNode;
	}


	constructor(scroll, domNode, val) {
		super(scroll, domNode, val);

		domNode.addEventListener('click', (evt) => {
			if(evt.target === this.domNode) {
				this.remove();
			}
		});

		this.createResizeObserver();
	}

	static register() {
		Quill.register(RCWrapper);
	}

	checkMerge() {
		return false;
	}
}

RCContainer.blotName = 'rc-container';
RCContainer.tagName = 'DIV';
RCContainer.className = 'ql-rc-container';


export class RCWrapper extends BlockEmbed {
	/**
	 * @param {Object} value 渲染参数 
	 * @param {String} value.type 组件类型 - 用来决定渲染哪种组件 
	 * @param {String} value.data 组件数据 - 保存组件的数据用以首次渲染及后续更新
	 */
	static create(value) {
		let domNode = super.create();
		domNode.dataset.type = value.type;
		domNode.dataset.data = (value.data && value.data !== 'undefined') ? JSON.stringify(JSON.parse(value.data)) : '';
		domNode.dataset.rcid = value.rcid || genId('rc');
		domNode.setAttribute('contenteditable', false);
		return domNode;
	}

	static value(domNode) {
		const valueObj = {}
		Object.entries(domNode.dataset).forEach(item => {
			valueObj[item[0]] = item[1];
		});
		return valueObj;
	}

	constructor(scroll, domNode, val) {
		super(scroll, domNode, val);
		this.quill = Quill.find(scroll.domNode.parentNode);
		let quill = this.quill;
		const _this = this;
		if(!val.type) {
			throw new Error("需传入组件类型");
		}
		domNode.addEventListener('keydown', (e) => {
			e.stopPropagation();
		});

		domNode.addEventListener("paste", (e) => {
			let html = (e.clipboardData || window.clipboardData).getData('text/html');
			const doc = new DOMParser().parseFromString(html, 'text/html');
			let pasteData = this.extractText(doc);
			renderReactComponent(domNode, {type: val.type, data: {pasteData}}, _this.save.bind(_this));
			e.preventDefault();
		});

		let reportInfo = scroll.reportInfo || {};
		let jsonData = (val.data && val.data !== 'undefined') ? JSON.parse(val.data) : {};
		Object.entries(reportInfo).forEach(item => {
			if(!jsonData[item[0]]) {
				jsonData[item[0]] = item[1];
			}
		});

		if(quill.isLoadingRender) {
			quill.asyncTasksAfterLoadingRender.push(() => {
				renderReactComponent(domNode, {type: val.type, data: jsonData}, this.save.bind(this));
			});
		} else {
			renderReactComponent(domNode, {type: val.type, data: jsonData}, this.save.bind(this));
		}
	}

	/**
	 * @param {HTMLElement} tableDom 
	 * @return {Array}
	 */
	extractText(docDom) {
		if(!(docDom instanceof Node)) return [];
		const trArr = docDom.querySelectorAll("tr");
		let textArr = [];
		trArr.forEach(tr => {
			let tdArr = [];
			Array.prototype.slice.call(tr.children).forEach(td => {
				tdArr.push(this.getText(td.firstChild));
			});
			textArr.push(tdArr);
		})
		return textArr;
	}

	getText(dom) {
		if (!dom) {
			return '';
		}
		let text = "";
		if(dom.nodeType === Node.TEXT_NODE) {
			text = dom.data;
		} 
		if(dom.firstChild) {
			text = `${text}${this.getText(dom.firstChild)}`;
		}

		if(dom.nextSibling) {
			text = `${text}${this.getText(dom.nextSibling)}`;
		}

		return text;
	}


	save(setName) {
		let deltaVal = RCWrapper.value(this.domNode);
		let quill = Quill.find(this.scroll.domNode.parentNode);
		let renderRCmodule = quill.getModule("renderRC");
		renderRCmodule.saveToSet(
			setName, 
			[
				{
					insert: {
						'render-react-component':  deltaVal
					},
				}, {
					insert: ''
				}
			]
		);
	}

}

RCWrapper.blotName = 'render-react-component';
RCWrapper.tagName = 'DIV';
RCWrapper.className = 'ql-render-react-component';

RCWrapper.requiredContainer = RCContainer;
RCContainer.children = [RCWrapper];

export default class RenderReactComponent extends Module {
	static register() {
		Quill.register(RCContainer);
	}

	operation
	team_id

	constructor(quill, options) {
		super(quill, options);
		this.operation = options.operation;
		this.team_id = options.team_id;

		const _this = this;
		const BACKSPACE = 'Backspace';

		quill.keyboard.addBinding(
			{ key: BACKSPACE },
			{
				offset: 0,
				collapsed: true,
			},
			function rcBackspace(range, context) {
				const [prev] = _this.quill.getLine(range.index - 1);
				if(prev instanceof RCWrapper) return false;
				return true
			}
		);

		let bindings = quill.keyboard.bindings[BACKSPACE];
		let thisBinding = bindings.pop();
		let index = 1;
		bindings.forEach(binding => {
			if (['page'].find(name => ~binding.handler.name.indexOf(name))) {
				index++;
			}
		})
		quill.keyboard.bindings[BACKSPACE].splice(index, 0, thisBinding)
	}

	saveToSet(name, data) {
		this.operation.add({name, content: JSON.stringify(data), team_id: this.team_id});
	}
} 