import Quill from "quill";
import { ContainerWrapper } from "../../../FreeContainer";

export default class BaseContainer extends ContainerWrapper {

	constructor(scroll, domNode, value) {
		super(scroll, domNode, value);
		this.pageBlot = value.pageBlot || null;
		this.quill = Quill.find(scroll.domNode.parentNode);
		this.PageBreakModule = this.quill.getModule('pageBreak');

		this.recoverDefault();

		this.quill.resizeObserver.addBlot(this, (entry) => {
			if (domNode.getAttribute('contenteditable') === 'true') {
				this.updateToolbarPosition(entry);
			}
		});

		domNode.addEventListener('dblclick', (event) => {
			this.turnToEditMode();
		});

		domNode.addEventListener('click', (event) => {
			if (domNode.getAttribute('contenteditable') === 'false') {
				event.stopPropagation();
			}
		});

		domNode.addEventListener('drop', event => {
			if (domNode.getAttribute('contenteditable') === 'false') {
				event.stopPropagation();
			}
		});
	}

	updateToolbarPosition(entry) {

	}

	recoverDefault() {
		this.domNode.setAttribute('contenteditable', false);
		this.domNode.style.cursor = 'default';
	}

	turnToEditMode() {
		this.quill.stopRecording = true;
		setTimeout(() => {
			this.turnToEditModeSync();
		});
	}

	turnToEditModeSync() {
		this.domNode.setAttribute('contenteditable', true);
		this.domNode.style.cursor = 'text';
		this.PageBreakModule.HeaderFooterManager.editingBlot = this;
		let index = this.quill.getIndex(this);
		this.quill.setSelection(index + this.length() - 1, 0, Quill.sources.USER);
	}

	attachToPageBlot() {
		this.PageBreakModule.pageForEach(pageBlot => {
			if (pageBlot._value.key === this.pageKey) {
				this.pageBlot = pageBlot;
				this.attachThisToPageBlot();
			}
		});
	}

	attachThisToPageBlot() {
		this.pageBlot.HeaderAndFooter[this.name] = this;
	}

	optimize(context) {
		super.optimize(context);
		this.attachAttrsToFlag({ top: this.domNode.offsetTop, height: this.domNode.offsetHeight, pageKey: this.pageKey });
	}
}