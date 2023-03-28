import Quill from "quill";
import Delta, { AttributeMap } from 'quill-delta';
import { isRcCompontent } from "../../common";

const Keyboard = Quill.import('modules/keyboard');
const Break = Quill.import("blots/break");
export default class KeyBoard extends Keyboard {
	static ARROW_LEFT = 'ArrowLeft';
	static ARROW_RIGHT = 'ArrowRight';
	static ARROW_UP = 'ArrowUp';
	static ARROW_DOWN = 'ArrowDown';
	static BACKSPACE = "Backspace";
	static ENTER = "Enter";
	static DELETE = "Delete"
	static A = "a";
	static PRIORITY_1 = 1;
	static PRIORITY_2 = 2;
	static PRIORITY_3 = 3;

	handleEnter(range, context) {
		this.quill.scroll.keyBoardAction = 'enter';

		// const [preLine, preOffset] = this.quill.getLine(range.index);
		// const isPreInEditor = this.isInEditor(preLine);
		super.handleEnter(range, context);
		// const _range = this.quill.getSelection();
		// const [line, offset] = this.quill.getLine(_range.index);
		// const isLineInEditor = this.isInEditor(line);
		// if(isPreInEditor && !isLineInEditor) {
		// 	let theNextSelection = this.findTheNextSelection(preLine);		
		// 	this.quill.setSelection(theNextSelection);
		// }
		this.quill.scroll.keyBoardAction = null;
	}


	handleBackspace(range, context) {
		if (context.event && isRcCompontent(context.event.target)) {
			return;
		}
		this.quill.scroll.keyBoardAction = 'backspace';
		// Check for astral symbols
		const length = /[\uD800-\uDBFF][\uDC00-\uDFFF]$/.test(context.prefix)
			? 2
			: 1;
		let [line] = this.quill.getLine(range.index);
		let [prev] = this.quill.getLine(range.index - 1);
		if (range.index === 0 || this.quill.getLength() <= 1) return;
		let formats = {};
		let delta = new Delta().retain(range.index - length).delete(length);
		if (context.offset === 0) {
			// Always deleting newline here, length always 1
			if (prev) {
				if (line.statics.blotName === 'table-cell-line' && !line.prev) return false;
				const curFormats = line.formats();
				const prevFormats = this.quill.getFormat(range.index - 1, 1);
				formats = AttributeMap.diff(curFormats, prevFormats) || {};
				if (Object.keys(formats).length > 0) {
					// line.length() - 1 targets \n in line, another -1 for newline being deleted
					const formatDelta = new Delta()
						.retain(range.index + line.length() - 2)
						.retain(1, formats);
					delta = delta.compose(formatDelta);
				}
			}
		}
		this.quill.updateContents(delta, Quill.sources.USER);
		this.quill.setSelection(range.index - 1);
		this.quill.focus();
		this.quill.scroll.keyBoardAction = null;
	}

	handleDeleteRange(range) {
		let module = this.quill.getModule('pageBreak');
		if (module.isAllSelectPage) {
			return false;
		}
		let [start] = this.quill.getLine(range.index);
		let maxIndex = range.index + range.length;
		let [end] = this.quill.getLine(maxIndex);
		let startContainer = start.getContainer ? start.getContainer(start) : null;
		let endContainer = end.getContainer ? end.getContainer(end) : null;
		let startContainerName = startContainer ? startContainer.statics.blotName : "";
		let endContainerName = endContainer ? endContainer.statics.blotName : "";
		if (startContainerName && endContainerName) {
			if (startContainerName === endContainerName) {
				if (startContainerName === "page-container") {
					if (startContainer.pagenum !== endContainer.pagenum) {
						// message.info("暂不支持跨页选择删除");
					}
				}
			}
			else {
				let startLastIndex = this.getSameContainerLastIndex(range.index + 1, maxIndex, startContainerName);
				let endLastIndex = this.getSameContainerLastIndex(startLastIndex + 1, maxIndex, endContainerName);

				// 忽略容器占位
				let startDelLength = startLastIndex - range.index - 1;
				let endDelLength = endLastIndex - startLastIndex;
				let delta = new Delta();
				delta.retain(range.index)
					.delete(startDelLength)
					.retain(1) // 忽略容器占位
					.delete(endDelLength);
				this.quill.updateContents(delta);
				// console.log("cur", range.index, "startLastIndex", startLastIndex, "endLastIndex", endLastIndex);
				return false;
			}
		}
		super.handleDeleteRange(range);
	}

	getSameContainerLastIndex = (index, maxIndex, blotName) => {
		let lastIndex = index;
		let line = this.quill.getLine(lastIndex)[0];
		while (lastIndex < maxIndex
			&& (line && line.getContainer && line.getContainer(line)?.statics.blotName === blotName)) {
			lastIndex++;
			line = this.quill.getLine(lastIndex)[0];
		}
		return lastIndex;
	}

	isInEditor(blot) {
		if (blot.parent) {
			if (blot.parent.statics.blotName === 'edit-container') {
				return true;
			} else {
				return this.isInEditor(blot.parent)
			}
		} else {
			return false;
		}
	}

	findTheNextSelection(blot) {
		if (blot.children.head instanceof Break) {
			return this.quill.getIndex(blot);
		}
		if (blot.parent) {
			if (blot.parent.statics.blotName === 'page-container') {
				// let editBlot = blot.parent.next.children.head.next;
				return this.quill.getIndex(blot.children.head);
			} else {
				return this.findTheNextSelection(blot.parent);
			}
		} else {
			return false;
		}
	}
}

/**
* @description 添加业务层按键绑定
* @param quill quill
* @param keyBinding 同默认addBinding参数
* @param context 同默认addBinding参数
* @param handler 同默认handler参数
* @return 
*/
export const addKeyBinding = (quill, keyBinding, context = {}, handler = {}) => {
	quill.keyboard.addBinding(
		keyBinding,
		context,
		handler
	);
	swapBinding(quill, keyBinding.key);
}

const swapBinding = (quill, key) => {
	let bindings = quill.keyboard.bindings[key];

	// console.log("prev", key, bindings);
	let customBindings = [];
	for (let i = bindings.length - 1; i > -1; i--) {
		let priority = bindings[i].priority;
		if (typeof priority === "number") {
			let ary = bindings.splice(i, 1);
			customBindings = customBindings.concat(ary);
		}
	}

	customBindings.sort((prev, next) => {
		return prev.priority - next.priority;
	})

	let result = [...customBindings, ...bindings];
	quill.keyboard.bindings[key] = result;

	// 	console.log("next", key, result);
	// 	console.log("finish", quill.keyboard.bindings[key]);
}

export const overRideKeyBoard = {
	'list empty enter': {
		key: 'Enter',
		collapsed: true,
		format: ['list'],
		empty: true,
		handler(range, context) {
			let formats = {};
			if (context.line === context.line.parent.children.tail) {
				formats = { list: false };
			} else {
				formats = { "list-content": true };
			}

			if (context.format.indent) {
				formats.indent = false;
			}
			this.quill.formatLine(
				range.index,
				range.length,
				formats,
				Quill.sources.USER,
			);
		},
	},
	// ...Keyboard.DEFAULTS.bindings,
	// "flag backspace": {
	// 	key: "Backspace",
	// 	format: ['container-flag', 'edit-container'],
	// 	offset: 0,
	// 	handler(range, context) {
	// 		console.log("====>>>>>>", range, context);
	// 	}
	// }	
}