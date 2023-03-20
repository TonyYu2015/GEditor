// import Quill from "quill";
// const Delta = Quill.import('delta');


export const OP_TYPES = {
	RETAIN: 'retain',
	DELETE: 'delete',
	UPDATE: 'update',
	INSERT: 'insert'
}


export const FUNCTION_NAMES = {
	UNDO_REDO: 'undo_redo',
	SYNC: 'sync',
	RECORD_INDEX: 'record_index',
	BLANK_PAGE: 'blank_page',
	SPLIT_PAGE: 'split_page'
}



export const CMD_TYPES = {
	UNDO_REDO: "redo_undo",
	INSERT: "insert",
	SYNC: "sync"
}


/**
* @description scroll的子对象
*/
export const SCROLL_CHILDREN = ["page-container", "page-footer", "page-header", "page-footer-first", "page-header-first"];