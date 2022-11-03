import Quill from "@/pages/ReportPage/Editor/register";
import { message } from "@wind/wind-ui";

const Module = Quill.import("core/module");

export default class CustomSet extends Module {
	constructor(quill, options) {
		super(quill, options);
		this.operation = options.operation;
		this.team_id = options.team_id;
	}

	saveSet() {
		const range = this.quill.getSelection();
		if(!range || range.length === 0) {
			message.warning("请先选中需要保存的内容");
			return;
		}
		this.delta = this.quill.getContents(range.index, range.length);
		if(this.setVisible) {
			this.setVisible(true);
		}
	}

	save(name) {
		this.operation.add({name, content: JSON.stringify(this.delta), team_id: this.team_id});
	}
}