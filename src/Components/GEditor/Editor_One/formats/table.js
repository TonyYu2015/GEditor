import Quill from "quill";
import QuillBetterTable from 'quill-better-table';
import { withContainer } from "../blots/container";


export default class Table extends QuillBetterTable {
	static register() {
		super.register();
		let TmpTableViewWrapper = Quill.import('formats/table-view');
		Quill.register(withContainer(TmpTableViewWrapper));
	}
}