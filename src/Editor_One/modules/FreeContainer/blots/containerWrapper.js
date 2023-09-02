import Quill from "quill";
import { genId } from "../../../common";
import { CMD_TYPES } from "../../../consts";
import KeyBoard, { addKeyBinding } from "../../KeyBoard";
import withWrapper from '../_withWrapper';

const Container = Quill.import('blots/container');
const Parchment = Quill.import('parchment');
const { BlockBlot, ContainerBlot, EmbedBlot } = Parchment;

export function withContainer(container) {
	class HighOrderContainer extends withWrapper(container) {

		constructor(scroll, domNode, value = {}) {
			super(scroll, domNode, value);
			this._value = {};
			this.isLimitCursorRange = false;
			this.autoAddNextBlock = false;
			this.unallowedChildrenNames = [];
			this.isLimitRemove = true;
			this.attrChangeList = [];
			Object.entries(value).forEach(item => {
				this._value[item[0]] = item[1];
			});

			domNode.addEventListener('drop', e => {
				e.preventDefault();
				return false;
			});

			domNode.addEventListener('click', (event) => {
				let isTargetBlot = false;
				for (let i = 0, len = event.path.length; i < len; i++) {
					let curBlot = Quill.find(event.path[i]);
					if (curBlot instanceof HighOrderContainer) {
						if (curBlot === this) {
							isTargetBlot = true;
						}
						break;
					}
				}
				if (!isTargetBlot) return;
				this.setFocusedContainer();
				return false;
			}, false);

			if (!this._value.key) {
				this._value.key = genId(this.statics.blotName);
			}
			this.addBindingRange(KeyBoard.ARROW_LEFT, 0);
			this.addBindingRange(KeyBoard.ARROW_RIGHT);
			this.addBindingRange(KeyBoard.ARROW_UP);
			this.addBindingRange(KeyBoard.ARROW_DOWN);
		}

		setFocusedContainer = () => {
			if (this.scroll.focusedContainer) {
				if (this.scroll.focusedContainer === this) {
					return;
				}
				this.scroll.focusedContainer.removeFocusedChange();

			}
			this.addFocusedChange();
		}

		optimize(context) {
			if (!this.isParentContainerAllowed()) {
				this.remove();
				return;
			}
			super.optimize(context);

			// 自动添加P标签，避免容器下没有P标签无法输入
			let childTail = this.children.tail;
			if (childTail
				&& childTail.autoAddNextBlock
				&& !childTail.next
				&& !this.quill.isLoadingRender) {
				let block = this.scroll.create('block');
				this.appendChild(block);
			}
		}

		isParentContainerAllowed = () => {
			let container = this.getContainer(this);
			if (container) {
				if (container.unallowedChildrenNames?.includes(this.statics.blotName)) {
					return false;
				}
			}
			return true;
		}

		addBindingRange = (key, offset) => {
			let _this = this;
			addKeyBinding(_this.quill,
				{ key },
				{
					offset,
					collapsed: true,
					priority: KeyBoard.PRIORITY_2
				},
				function limitRange(range) {
					let [prev] = _this.quill.getLine(range.index);
					if (prev && prev.getContainer && prev.getContainer(prev)?.isLimitCursorRange) {
					}
					else {
						return true;
					}

					let nextNoramlIndex = getNextIndex(_this.quill, key, range.index);
					let [next] = _this.quill.getLine(nextNoramlIndex);
					if (!next) {
						return false;
					}
					if (!_this.isInSameContainer(prev, next)) {
						return false;
					}
					return true;
				}
			);
		}

		isInSameContainer = (line, prev) => {
			return line && line.getContainer && prev && prev.getContainer && line.getContainer(line) === prev.getContainer(prev);
		}

		addFocusedChange() {
			this.scroll.focusedContainer = this;
			if (this.statics.blotName === 'page-container') return;
			this.domNode.classList.add('shadow_container');
		}

		removeFocusedChange() {
			this.domNode.classList.remove('shadow_container');
		}

		checkMerge() {
			return super.checkMerge() && this._value.key === this.next._value.key;
		}

		attachAttrsToFlag(attrs) {
			if (typeof attrs !== "object") {
				throw new Error('attrs argument should be an object!');
			}

			if (this.quill.cmdType === CMD_TYPES.UNDO_REDO || this.quill.cmdType === CMD_TYPES.INSERT) {
				return;
			}

			let isChanged = false;
			Object.entries(attrs).forEach(item => {
				let originValue = this._value[item[0]];
				if (originValue !== item[1]) {
					this._value[item[0]] = item[1];
					isChanged = true;
				}
			})

			let nestData;
			if (!this.quill.isLoadingRender && isChanged) {
				let manager = this.quill.NestContainerManager;
				nestData = manager.getNestDataByKey(this._value.key);
				if (nestData) {
					let prev = { ...nestData };
					Object.entries(attrs).forEach(item => {
						nestData[item[0]] = item[1];
					})
					let next = { ...nestData };
					this.addRecord(prev, next);
				}
			}
		}

		// 记录属性变化，1秒内的操作会被合并成一条记录
		addRecord = (prev, next) => {
			if (!this.isAttrChangeRecording) {
				this.isAttrChangeRecording = true;
				this.attrPrev = prev;
				this.attrNext = next;
				setTimeout(() => {
					let history = this.quill.getModule("history");
					// history.record([{ prev: this.attrPrev, next: this.attrNext }]);
					history.record(null, null, true);
					this.isAttrChangeRecording = false;
					this.attrPrev = null;
					this.attrNext = null;
				}, 1000);
			} else {
				this.attrNext = next;
			}
		}

		remove() {
			super.remove();
		}

	}
	HighOrderContainer.allowedChildren = [BlockBlot, ContainerBlot, EmbedBlot];
	return HighOrderContainer;
}

export const getNextIndex = (quill, key, index) => {
	let nextIndex = index;
	switch (key) {
		case KeyBoard.ARROW_LEFT:
			nextIndex--;
			break;
		case KeyBoard.ARROW_RIGHT:
			nextIndex++;
			break;
		case KeyBoard.ARROW_UP:
			nextIndex = getNextLineIndex(quill, nextIndex, false);
			break;
		case KeyBoard.ARROW_DOWN:
			nextIndex = getNextLineIndex(quill, nextIndex, true);
			break;
	}
	return nextIndex;
}

export const getNextLineIndex = (quill, index, isDown) => {
	let [prev] = quill.getLine(index);
	let prevLeft = quill.getBounds(index).left;
	let nextIndex = isDown ? index + 1 : index - 1;
	if (nextIndex < 0) {
		return nextIndex;
	}
	let nextLeft = quill.getBounds(nextIndex).left;
	let [next] = quill.getLine(nextIndex);
	while (nextLeft !== undefined
		&& prev === next
		&& (isDown ? prevLeft < nextLeft : prevLeft > nextLeft)) {
		isDown ? nextIndex++ : nextIndex--;
		if (nextIndex < 0) {
			break;
		}
		let [line] = quill.getLine(nextIndex);
		next = line;
		nextLeft = quill.getBounds(nextIndex).left;
	}
	return nextIndex;
}

export default withContainer(Container);