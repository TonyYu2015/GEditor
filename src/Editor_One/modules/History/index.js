import Quill from "quill";
import { CMD_TYPES } from "../../consts";

const _History = Quill.import('modules/history');
const Delta = Quill.import('delta');

class History extends _History {
	constructor(quill, options) {
		super(quill, options);
		this.changeNests = [];
		this.wholeDatas = [];
		this.prevNestsJson = null;
		this.prevDeltaJson = "";
	}

	initRecord = (deltaJson, nestsJson) => {
		this.prevDeltaJson = deltaJson;
		this.prevNestsJson = nestsJson;
	}

	record(changeDelta, oldDelta, isAttr = false) {
		let manager = this.quill.NestContainerManager;
		if (this.quill.isLoadingRender || this.quill.stopRecording) {
			return;
		}

		if(!isAttr && changeDelta?.ops?.length <= 0) return;

		let time = new Date().getTime();
		let isMerge = false;
		if (this.stack.undo.length > 0) {
			let lastTime = this.stack.undo[this.stack.undo.length - 1].time;
			if (time - lastTime < 1000) {
				isMerge = true;
			}
		}

		let prev = { delta: this.prevDeltaJson, nests: this.prevNestsJson };

		let deltaJson = JSON.stringify(this.quill.editor.delta);

		let nests = manager.getChildrenNestDatasByBlot(this.quill.scroll);
		manager.NestContainer = nests;

		let nestsJson = JSON.stringify(nests);
		let next = { delta: deltaJson, nests: nestsJson };

		if (isMerge) {
			this.stack.undo[this.stack.undo.length - 1].next = next;
			this.prevDeltaJson = deltaJson;
			this.prevNestsJson = nestsJson;
			return;
		}

		this.stack.redo = [];
		this.stack.undo.push({ prev, next, time });
		this.quill.toolbarSet.setHistory({ undo: true, redo: false });

		this.prevDeltaJson = deltaJson;
		this.prevNestsJson = nestsJson;
	}

	clear() {
		super.clear();
		this.stack = { undo: [], redo: [] };
		if (this.quill.toolbarSet) {
			this.quill.toolbarSet.setHistory({ undo: false, redo: false });
		}
	}

	change(source, dest) {
		if (this.stack[source].length === 0)
			return;
		const data = this.stack[source].pop();
		this.ignoreChange = true;
		this.quill.cmdType = CMD_TYPES.UNDO_REDO;
		let manager = this.quill.NestContainerManager;
		let defaultDelta;
		let nests;
		let deltaJson;
		let nestsJson;

		if (source === "undo") {
			deltaJson = data.prev.delta;
			nestsJson = data.prev.nests;
		} else {
			deltaJson = data.next.delta;
			nestsJson = data.next.nests;
		}

		defaultDelta = new Delta(JSON.parse(deltaJson));
		nests = JSON.parse(nestsJson);

		manager.NestContainer = nests;

		let len = this.quill.getLength();
		let delta = new Delta();
		delta.retain(0).delete(len);
		this.quill.updateContents(delta.retain(0).concat(new Delta(defaultDelta)).delete(1), Quill.sources.API);

		this.stack[dest].push(data);

		this.ignoreChange = false;
		this.quill.cmdType = null;

		this.prevDeltaJson = deltaJson;
		this.prevNestsJson = nestsJson;

		this.quill.toolbarSet.setHistory({ undo: this.stack.undo.length > 0, redo: this.stack.redo.length > 0 });

		// 重新建立页眉页脚关联关系
		const pageBreak = this.quill.getModule('pageBreak');
		pageBreak.HeaderFooterManager.initialize();
	}
}
export default History;