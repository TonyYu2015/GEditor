import Quill from "quill";
import Delta, { AttributeMap } from 'quill-delta';
import PageBreak from "../PageBreak";
import { isRcCompontent } from "../../common";
// import EditContainer from '../../formats/editContainer';

const Keyboard = Quill.import('modules/keyboard');
const Break = Quill.import("blots/break");

export default class KeyBoard extends Keyboard {

	handleEnter(range, context) {
		this.quill.scroll.keyBoardAction = 'enter';
		// const [preLine, preOffset] = this.quill.getLine(range.index);
		// const isPreInEditor = this.isInEditor(preLine);
		super.handleEnter(range, context);
		// const _range = this.quill.getSelection();
		// const [line, offset] = this.quill.getLine(_range.index);
		// const isLineInEditor = this.isInEditor(line);
		// if(isPreInEditor && !isLineInEditor) {
		// 	let theNextSelection = this.findTheNextSelection(preLine);		
		// 	this.quill.setSelection(theNextSelection);
		// }
		this.quill.scroll.keyBoardAction = null;
	}


  handleBackspace(range, context) {
		if(context.event && isRcCompontent(context.event.target)) {
			return;
		}
		this.quill.scroll.keyBoardAction = 'backspace';
    // Check for astral symbols
    const length = /[\uD800-\uDBFF][\uDC00-\uDFFF]$/.test(context.prefix)
      ? 2
      : 1;
    let [line] = this.quill.getLine(range.index);
    let [prev] = this.quill.getLine(range.index - 1);
    if (range.index === 0 || this.quill.getLength() <= 1) return;
    let formats = {};
    let delta = new Delta().retain(range.index - length).delete(length);
    if (context.offset === 0) {
      // Always deleting newline here, length always 1
      if (prev) {
				if (line.statics.blotName === 'table-cell-line' && !line.prev) return false;
        const curFormats = line.formats();
        const prevFormats = this.quill.getFormat(range.index - 1, 1);
        formats = AttributeMap.diff(curFormats, prevFormats) || {};
        if (Object.keys(formats).length > 0) {
          // line.length() - 1 targets \n in line, another -1 for newline being deleted
          const formatDelta = new Delta()
            .retain(range.index + line.length() - 2)
            .retain(1, formats);
          delta = delta.compose(formatDelta);
        }
      }
    }
    this.quill.updateContents(delta, Quill.sources.USER);
		this.quill.setSelection(range.index - 1);
    this.quill.focus();
		this.quill.scroll.keyBoardAction = null;
  }

	isInEditor(blot) {
		if(blot.parent) {
			if(blot.parent.statics.blotName === 'edit-container') {
				return true;
			} else {
				return this.isInEditor(blot.parent)
			}
		} else {
			return false;
		}		
	}

	findTheNextSelection(blot) {
		if(blot.children.head instanceof Break) {
			return this.quill.getIndex(blot);
		}
		if(blot.parent) {
			if(blot.parent.statics.blotName === 'page-container') {
				// let editBlot = blot.parent.next.children.head.next;
				return this.quill.getIndex(blot.children.head);
			} else {
				return this.findTheNextSelection(blot.parent);
			}
		} else {
			return false;
		}
	}
}

export const overRideKeyBoard = {
	...Keyboard.DEFAULTS.bindings,
	// "flag backspace": {
	// 	key: "Backspace",
	// 	format: ['container-flag', 'edit-container'],
	// 	offset: 0,
	// 	handler(range, context) {
	// 		console.log("====>>>>>>", range, context);
	// 	}
	// }	
}