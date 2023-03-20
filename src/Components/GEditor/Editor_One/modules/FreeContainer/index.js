import Quill from "quill";
import KeyBoard, { addKeyBinding } from "../KeyBoard";
import { Block, BlockEmbed } from "./blots/block";
import ContainerWrapper from './blots/containerWrapper';
import withWrapper from "./_withWrapper";

const Module = Quill.import('core/module');

class FreeContainer extends Module {
	static register() {
		Quill.register(Block);
		Quill.register({ 'blots/block/embed': BlockEmbed });
	}

	constructor(quill, options) {
		super(quill, options);
		this.addBindingBackspace();
	}

	addBindingBackspace = () => {
		let _this = this;
		// 第三方表格库(better-table)有个BUG，会把自己的backspace按键优先级提到最高，且覆盖掉匹配结果的第一个binding
		// 这里添加一个占用，处理better-table绑定错误处理问题
		addKeyBinding(this.quill,
			{ key: KeyBoard.BACKSPACE }, { priority: 0 },
			function fixBetterTableIncorrectBinding() {
				return true;
			});
		addKeyBinding(_this.quill,
			{ key: KeyBoard.BACKSPACE },
			{
				offset: 0,
				collapsed: true,
				priority: KeyBoard.PRIORITY_1
			},
			function freeContainerBackspace(range) {
				if (_this.isAllSelectPage) {
					return false;
				}
				let [prev] = _this.quill.getLine(range.index);
				let [next] = _this.quill.getLine(range.index - 1);
				const prevContainer = prev.getContainer && prev.getContainer(prev);
				const nextContainer = next.getContainer && next.getContainer(next);

				if (prevContainer && nextContainer) {
					if (prevContainer !== nextContainer
						&& prevContainer.statics.blotName === "page-container"
						&& nextContainer.statics.blotName !== "page-container"
						&& nextContainer.isLimitRemove
					) {
						return false;
					}
				}
				return true;
			}
		);
	}
}

export { FreeContainer as default, ContainerWrapper, withWrapper };
