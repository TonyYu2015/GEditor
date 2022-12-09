import Quill from "quill";

const _History = Quill.import('modules/history');

class History extends _History {
	constructor(quill, options) {
		super(quill, options);
	}

	record(...args) {
		console.log("====>>>>record", this.stack);
		super.record(...args);
		this.quill.toolbarSet.setHistory({undo: this.stack.undo.length > 0, redo: this.stack.redo.length > 0});
	}

	clear() {
		super.clear();
		if(this.quill.toolbarSet) {
			this.quill.toolbarSet.setHistory({undo: false, redo: false});
		}
	}

	change(...args) {
		console.log("====>>>>change", this.stack);
		super.change(...args);
		this.quill.toolbarSet.setHistory({undo: this.stack.undo.length > 0, redo: this.stack.redo.length > 0});
	}
}

export default History;