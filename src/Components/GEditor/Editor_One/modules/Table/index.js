import Quill from "quill";
import QuillBetterTable from 'quill-better-table';
import { withWrapper } from "../FreeContainer";
import ClipBoard from "./clipboard";
import { extendTableContainer, extendTableCellLine, extendTableCell } from "./extendTable";

const Delta = Quill.import('delta');


export default class Table extends QuillBetterTable {
	static register() {
		super.register();
		const TableViewWrapper = Quill.import('formats/table-view');
		const TableContainer = Quill.import('formats/table-container');
		const TableCol = Quill.import('formats/table-col');
    const TableCellLine = Quill.import('formats/table-cell-line');
    this.TABLE_CELL_LINE = TableCellLine.blotName;
    const TableCell = Quill.import('formats/table');

    Quill.register({
      'formats/table-view': withWrapper(TableViewWrapper),
      'formats/table-container': extendTableContainer(TableContainer, TableCol),
      'formats/table-cell-line': extendTableCellLine(TableCellLine),
      'formats/table': extendTableCell(TableCell),

      'modules/clipboard': ClipBoard
    });

	}

  constructor(quill, options) {
    super(quill, options);
    this.TABLE_CELL_LINE = this.constructor.TABLE_CELL_LINE;
    quill.clipboard.addMatcher('td', this.matchTableCellStyle.bind(this));
  }
  
  showTableTools(table, quill, options) {
    super.showTableTools(table, quill, options);
    if(this.tableSelection) {
      this.tableSelection.destroy();
      let TableSelectionPrototype = Object.getPrototypeOf(this.tableSelection);
      this.quill.root.removeEventListener("mousedown", this.tableSelection.selectingHandler, false);
      class TableSelection extends TableSelectionPrototype.constructor {
        mouseDownHandler(e) {
          const startTd = e.target.closest('td[data-row]')
          const endTd = e.target.closest('td[data-row]')
          if(!startTd || !endTd) return;
          super.mouseDownHandler(e);
        }
      }
      this.tableSelection = new TableSelection(table, quill, options);
    }
  }

  /**
   * 
   * @param {*} node 
   * @param {*} delta 
   * @param {*} scroll 
   * @returns 
   * node 组成：td、文本、font
   */
  matchTableCellStyle(node, delta, scroll) {
    console.log("=====matchTableCellStyle", node, delta);
    let nodeClass = node.getAttribute('class');
    let nodeChildren = node.childNodes;
    const tableStyle = this.quill.tableStyle;

    return delta.reduce((newDelta, op) => {
      if(op.insert === '\n' && op.attributes[this.TABLE_CELL_LINE])  {
        let styleArr = [];
        if(tableStyle[nodeClass]) {
          let nodeEntries = Object.entries(tableStyle[nodeClass]) || [];
          for(let m of nodeEntries) {
            switch(m[0]) {
              case 'background':
              case 'text-align':
              case 'vertical-align':
                styleArr.push(`${m[0]}: ${m[1]};`);
                break;
              default:
                break;
            }
          }
        }
        newDelta.insert(op.insert, {
          ...op.attributes,
          [this.TABLE_CELL_LINE]: {
            ...op.attributes[this.TABLE_CELL_LINE],
            ...(styleArr.length > 0 ? {style: styleArr.join(' ')} : {})
          }
        });
      } else if(op.insert && typeof op.insert === 'string') {
        if(nodeChildren.length === 1 && nodeChildren[0].nodeType === Node.TEXT_NODE) {
          newDelta.insert(nodeChildren[0].data, this.matchStyle(tableStyle[nodeClass]));
        } else {
          nodeChildren.forEach(child => {
            if(child.nodeType === Node.TEXT_NODE) {
              newDelta.insert(child.data);
            } else if(child.nodeType === Node.ELEMENT_NODE) {
              let childClass = child.getAttribute('class');
              newDelta.insert(child.innerText.replace(/\n/g, ''), this.matchStyle(tableStyle[childClass]));
            } 
          });
        }
      } else {
        newDelta.insert(op.insert, op.attributes);
      }

      return newDelta;
    }, new Delta());
  }

  /**
   * 
   * @param {Object} tableStyle 
   * @returns {Object}
   */
  matchStyle(tableStyle) {
    if(!tableStyle) return {};
    let childStyleObj = {};
    let childEntries = Object.entries(tableStyle) || [];
    for(let m of childEntries) {
      switch(m[0]) {
        case 'font-weight':
          if(+m[1] >= 700) {
            childStyleObj.bold = true;
          }
          break;
        case 'font-style':
          if(m[1] === 'italic') {
            childStyleObj.italic = true;
          }
          break;
        case 'text-decoration':
          if(m[1] === 'underline') {
            childStyleObj.underline = true;
          }
          break;
        case 'color':
          if(m[1] !== 'black') {
            childStyleObj.color = m[1];
          }
          break;
        case 'font-size':
          let size = Math.floor(+m[1].slice(0, m[1].length - 2) * 4 / 3); // 1px = 0.75pt
          if(size !== 12) {
            childStyleObj.size = `${size}px`;
          }
          break;
        case 'font-family':
          if(m[1] !== '宋体') {
            childStyleObj.font = m[1].split(',')[0];
          }
          break;
        default:
          break;
      }
    }
    return childStyleObj;
  }

	insertTable(tableRows, columns) {
    const range = this.quill.getSelection(true)
    if (range == null) return
    let currentBlot = this.quill.getLeaf(range.index)[0]
    let delta = new Delta().retain(range.index)
		let rows = null;

    if (isInTableCell(currentBlot)) {
      console.warn(`Can not insert table into a table cell.`)
      return;
    }

    delta.insert('\n')
    // insert table column
		if(Array.isArray(tableRows) && Array.isArray(tableRows[0])) {
			rows = tableRows.length;
			columns = tableRows[0].length;
		} else {
			rows = tableRows;
		}

    delta = new Array(columns).fill('\n').reduce((memo, text) => {
      memo.insert(text, { 'table-col': true })
      return memo
    }, delta)
    // insert table cell line with empty line
    delta = new Array(rows).fill(0).reduce((memo, next, index) => {
      let tableRowId = rowId()
      return new Array(columns).fill(`\n`).reduce((memo, text, i) => {
				if(Array.isArray(tableRows)) {
					memo.insert(`${tableRows[index][i]}${text}`, { 'table-cell-line': {row: tableRowId, cell: cellId()} });
				} else {
					memo.insert(text, { 'table-cell-line': {row: tableRowId, cell: cellId()} });
				}
        return memo
      }, memo)
    }, delta)

    this.quill.updateContents(delta, Quill.sources.USER)
	}
}

function isTableCell (blot) {
  return blot.statics.blotName === 'table-cell-line';
}

function isInTableCell (current) {
  return current && current.parent
    ? isTableCell(current.parent)
      ? true
      : isInTableCell(current.parent)
    : false
}

function rowId() {
  const id = Math.random()
    .toString(36)
    .slice(2, 6)
  return `row-${id}`
}

function cellId() {
  const id = Math.random()
    .toString(36)
    .slice(2, 6)
  return `cell-${id}`
}