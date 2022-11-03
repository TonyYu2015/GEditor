import Quill from "quill";

export function extendTableContainer(TmpTableContainer, TableCol) {
  return class TableContainer extends TmpTableContainer {
    updateTableWidth() {
      const quill = Quill.find(this.scroll.domNode.parentNode)
      if (quill.isLoadingRender) {
        quill.asyncTasksAfterLoadingRender.push(() => {
          const colGroup = this.colGroup()
          if (!colGroup) return
          const tableWidth = colGroup.children.reduce((sumWidth, col) => {
            sumWidth = sumWidth + parseInt(col.formats()[TableCol.blotName].width, 10)
            return sumWidth
          }, 0)
          this.domNode.style.width = `${tableWidth}px`
        });
      } else {
        super.updateTableWidth();
      }
    }
  }
}


export function extendTableCellLine(TmpTableCellLine) {
  return class TableCellLine extends TmpTableCellLine {
    static create(value) {
      let node = super.create(value);

      if (value.style) {
        node.setAttribute(`data-style`, value.style);
      }

      return node;
    }

    static formats(domNode) {
      const formats = { ...super.formats(domNode) };

      if (domNode.hasAttribute(`data-style`)) {
        formats.style = domNode.getAttribute(`data-style`) || undefined
      }
      return formats
    }

    constructor(scroll, dom, value) {
      super(scroll, dom, value);
      const _this = this;
      dom.addEventListener('paste', _this.pasteIntoTableCell.bind(_this, scroll));
    }

    pasteIntoTableCell(scroll, e) {
      const html = e.clipboardData.getData('text/html');
    }

    isTable() {

    }

    optimize(context) {
      const dataAttributes = this.domNode.dataset;
      if (this.statics.requiredContainer &&
        !(this.parent instanceof this.statics.requiredContainer)) {
        this.wrap(this.statics.requiredContainer.blotName, { ...dataAttributes })
      }
      super.optimize(context)
    }
  }
}

export function extendTableCell(TmpTableCell) {
  return class TableCell extends TmpTableCell {
    static create(value) {
      let node = super.create(value);
      if (value.style) {
        node.setAttribute('style', value.style);
      }
      return node;
    }
  }
}