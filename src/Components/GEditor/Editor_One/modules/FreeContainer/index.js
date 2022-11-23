import Quill from "quill";
import ContainerWrapper from './formats/container_wrapper';
import ContainerFlag from './formats/container_flag';

export { ContainerWrapper, ContainerFlag };

const Module = Quill.import('core/module');
const _Scroll = Quill.import('blots/scroll');
const Container = Quill.import('blots/container');

class Scroll extends _Scroll {
	updateContainer(blot) {
		if (blot === this) return;
		let flag = this.getTheNearestFlag(blot);
		if (flag !== null) {
			blot.wrap(flag.statics.requiredContainer.blotName, { key: flag.key, level: flag.level });
		}
	}

	getTheNearestFlag(blockScopeBlot) {
		let theFlag = null;
		let index = 0;
		let before = blockScopeBlot;
		let nextPrev = null;
		let wip = blockScopeBlot.prev || blockScopeBlot.parent;
		let nextWork = function () {
			let blot = wip;
			index++;
			if (
				!theFlag
				&& blot instanceof ContainerFlag
				&& index < blot.childlength
				&& blot.prevlength < blot.childlength
			) {
				if (
					!(blockScopeBlot instanceof Container)
					|| (blockScopeBlot instanceof ContainerWrapper && blockScopeBlot.level > blot.level)
					|| (!blockScopeBlot.descendant(blot.statics.requiredContainer)[0] && !(blockScopeBlot instanceof blot.statics.requiredContainer))
				) {
					theFlag = blot;
					return;
				}
			}
			if (theFlag) return;

			while (!blot.prev) {
				blot = blot.parent;
				if (!blot) {
					wip = null;
					return;
				}
			}
			wip = blot.prev;
		};

		while (wip && wip !== this) {
			nextPrev = this.beginWork(wip);
			if (nextPrev === null || nextPrev === before) {
				before = wip;
				while (wip && !(wip instanceof Container)) {
					nextWork();
					if (theFlag) break;
				}
				if (theFlag) break;
				wip = !wip ? wip : wip.children.head;
			} else {
				wip = nextPrev;
			}
		}

		let container = this.getContainer(blockScopeBlot);
		if (
			container &&
			theFlag &&
			(
				(container instanceof theFlag.statics.requiredContainer) ||
				container.level >= theFlag.level
			)) {
			return null;
		}

		if (theFlag) {
			theFlag.updatePrevLength(theFlag.prevlength + 1);
		}

		return theFlag;
	}

	getContainer(blot) {
		if (blot.parent && blot.parent.statics.blotName !== 'scroll') {
			if (blot.parent instanceof ContainerWrapper) {
				return blot.parent;
			} else {
				return this.getContainer(blot.parent);
			}
		}
		return null;
	}

	beginWork(blot) {
		if (blot.next) {
			return blot.next;
		} else if (blot instanceof Container) {
			return blot.children.head;
		} else {
			return null;
		}
	}
}


export default class FreeContainer extends Module {
	static register() {
		Quill.register('formats/container_wrapper', ContainerWrapper);
		Quill.register('formats/container_flag', ContainerFlag);
		Quill.register('blots/scroll', Scroll);
	}

	constructor(quill, options) {
		super(quill, options);
		const _this = this;
		const BACKSPACE = 'Backspace';

		quill.keyboard.addBinding(
			{ key: BACKSPACE },
			{
				offset: 0,
				collapsed: true,
			},
			function freeBackspace(range, context) {
				const [line] = _this.quill.getLine(range.index);
				const [prev] = _this.quill.getLine(range.index - 1);
				if (prev instanceof ContainerFlag) return false;
				if ((line.parent instanceof ContainerWrapper) && (prev.parent instanceof ContainerWrapper) && line.parent !== prev.parent) return false;
				return true;
				// if ((line instanceof Block) && (prev instanceof Block) && !_this.isInSameContainer(line, prev)) {
				// 	return false;
				// }
				// if (prev instanceof ContainerFlag && !(line instanceof Block)) {
				// 	line.format(line.statics.blotName, null);
				// 	return false;
				// }
				// return true
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

	isInSameContainer(line, prev) {
		return line.getContainer(line) === prev.getContainer(prev);
	}

}