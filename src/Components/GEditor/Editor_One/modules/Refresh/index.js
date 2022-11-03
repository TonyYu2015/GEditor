import Quill from "quill";
import { writeUserLog } from "../../../../../utils/request";

const Module = Quill.import('core/module');

export default class Refresh extends Module {
	refreshAll() {
		writeUserLog('922604650035', { type: '全局刷新' });
		const quillLines = this.quill.getLines();
		this.refresh(quillLines);

		const insertmacro = this.quill.getModule('insertmacro');
		insertmacro.refreshAll();
	}	

	refreshSelected() {
		writeUserLog('922604650035', { type: '选中刷新' });
		const quillRange = this.quill.getSelection(true);
		if(quillRange) {
			let linesSelect = this.quill.getLines(quillRange.index, quillRange.length);
			this.refresh(linesSelect);
		} else {
			console.warn('no select range');
		}
	}

	refresh(linesSelect) {
		if (linesSelect && linesSelect.length > 0) {
			linesSelect.forEach(blot => {
				if (blot.statics && blot.statics.blotName === 'funTag') {
					blot.refresh();
				}
				this.refresh(blot.children);
			});
		}
		else {
			console.warn('report editor not lines');
		}
	}
}