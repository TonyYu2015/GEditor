import Quill from "quill";
import { getEventComposedPath } from "../../../common";
import LayoutContextMenu from "../../../components/ContextMenu";
import withWrapper from '../_withWrapper';
const Container = Quill.import('blots/container');
const Parchment = Quill.import('parchment');
const { BlockBlot, ContainerBlot, EmbedBlot } = Parchment;

export function withCompContainer(container) {
	class CompContainer extends withWrapper(container) {
		constructor(scroll, domNode, value = {}) {
			super(scroll, domNode, value);
			scroll.domNode.addEventListener('click', (event) => {
				if (this.isInContainer(event.target)) {
					if (!this.isFocused()) {
						this.addFocusedChange();
					}
					return false;
				} else {
					if (this.isFocused()) {
						this.removeFocusedChange();
					}
				}
			});

			domNode.addEventListener("contextmenu", (e) => {
				e.preventDefault();
				e.stopPropagation();
				let path = getEventComposedPath(e);
				if (!path || path.length <= 0) return;
				new LayoutContextMenu({
					left: e.pageX,
					top: e.pageY
				}, this.quill, [
					{
						text: "remove",
						clickEvt: (evt) => {
							evt.preventDefault();
							this.remove();
						}
					}
				]);
			}, false);

		}

		isInContainer = (node) => {
			while (node && node !== this.scroll.domNode) {
				if (node.parentElement === this.domNode) {
					return true;
				} else {
					return this.isInContainer(node.parentElement);
				}
			}
			return false;
		}

		isFocused = () => {
			let exist = false;
			let focusedClassName = this.getFocusedClassName();
			if (focusedClassName) {
				this.domNode.classList.forEach(value => {
					if (value === focusedClassName) {
						exist = true;
					}
				});
			}
			return exist;
		}


		addFocusedChange() {
			this.scroll.focusedContainer = this;
			let focusedClassName = this.getFocusedClassName();
			if (focusedClassName)
				this.domNode.classList.add(focusedClassName);
		}

		getFocusedClassName = () => {
			return "";
		}

		removeFocusedChange() {
			let focusedClassName = this.getFocusedClassName();
			if (focusedClassName)
				this.domNode.classList.remove(focusedClassName);
		}
	}
	CompContainer.allowedChildren = [BlockBlot, ContainerBlot, EmbedBlot];
	return CompContainer;
}

export default withCompContainer(Container);