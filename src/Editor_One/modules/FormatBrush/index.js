import Quill from "quill";

const Module = Quill.import('core/module');

export default class FormatBrush extends Module {
	isActive = false;
	formatDom;

	constructor(quill, options) {
		super(quill, options);
		this.formatDom = document.querySelector(".ql-formatBrush");
	}

	toogleFormat() {
		const quill = this.quill;

		if(!this.isActive) {
			const range = quill.getSelection(true);
			if(range === null || range.length === 0) return;
			this.isActive = true;
			this.formatDom.classList.add("ql-brush-active");
			this.format = quill.getFormat(range);
			this.bindFn = this.setFormat.bind(this);
			quill.on('selection-change', this.bindFn);
		} else {
			this.isActive = false;
			this.formatDom.classList.remove("ql-brush-active");
			quill.off('selection-change', this.bindFn);
		}

	}

	setFormat(range, oldRange, source) {
		if(this.format) {
			this.quill.removeFormat(range);
			this.quill.formatText(range.index, range.length + 1, this.format);
			this.format = null;
		}
		this.toogleFormat();
	}
}