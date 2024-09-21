import Quill from 'quill';
import type { TableResizeLineOptions } from '../utils';
import { blotName, findParentBlot, findParentBlots, tableColMinWidthPre, tableColMinWidthPx, tableRowMinWidthPx } from '../utils';
import { type TableCellFormat, TableRowFormat } from '../formats';

export class TableResizeLine {
  colResizer: HTMLElement;
  rowResizer: HTMLElement;
  currentTableCell?: HTMLElement;
  dragging = false;
  options: TableResizeLineOptions;

  constructor(public quill: Quill, options: Partial<TableResizeLineOptions>) {
    this.options = this.resolveOptions(options);
    this.colResizer = this.quill.addContainer('ql-table-resize-line-col');
    this.rowResizer = this.quill.addContainer('ql-table-resize-line-row');

    this.quill.root.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.dragging) return;
      const tableCell = this.findTableCell(e);
      if (!tableCell) return;
      const tableCellBlot = Quill.find(tableCell) as TableCellFormat;
      if (!tableCellBlot) return;
      if (this.currentTableCell !== tableCell) {
        this.showResizer();
        this.currentTableCell = tableCell;
        const tableMainBlot = findParentBlot(tableCellBlot, blotName.tableMain);
        if (tableMainBlot.getCols().length > 0) {
          this.updateColResizer(tableCellBlot);
        }
        this.updateRowResizer(tableCellBlot);
      }
    });
    this.quill.on(Quill.events.TEXT_CHANGE, () => {
      this.hideResizer();
    });
  }

  resolveOptions(options: Partial<TableResizeLineOptions>) {
    return Object.assign({}, options);
  }

  findTableCell(e: MouseEvent) {
    for (const el of e.composedPath()) {
      if (el instanceof HTMLElement && el.tagName === 'TD') {
        return el;
      }
    }
    return null;
  }

  updateColResizer(tableCellBlot: TableCellFormat) {
    this.quill.container.removeChild(this.colResizer);
    this.colResizer = this.quill.addContainer('ql-table-resize-line-col');

    const [tableBodyBlot, tableMainBlot] = findParentBlots(tableCellBlot, [blotName.tableBody, blotName.tableMain] as const);
    const tableBodyect = tableBodyBlot.domNode.getBoundingClientRect();
    const tableCellRect = tableCellBlot.domNode.getBoundingClientRect();
    const rootRect = this.quill.root.getBoundingClientRect();
    Object.assign(this.colResizer.style, {
      top: `${tableBodyect.y - rootRect.y}px`,
      left: `${tableCellRect.right - rootRect.x}px`,
      height: `${tableBodyect.height}px`,
    });

    const cols = tableMainBlot.getCols();
    const curColIndex = cols.findIndex(col => col.colId === tableCellBlot.colId);
    let tipColBreak: HTMLElement | null;
    const handleMousemove = (e: MouseEvent) => {
      const rect = cols[curColIndex].domNode.getBoundingClientRect();
      const tableWidth = tableMainBlot.domNode.getBoundingClientRect().width;
      let resX = e.clientX;

      if (tableMainBlot.full) {
        // max width = current col.width + next col.width
        // if current col is last. max width = current col.width
        const minWidth = (tableColMinWidthPre / 100) * tableWidth;
        const maxRange = resX > rect.right
          ? cols[curColIndex + 1]
            ? cols[curColIndex + 1].domNode.getBoundingClientRect().right - minWidth
            : rect.right - minWidth
          : Infinity;
        const minRange = rect.x + minWidth;
        resX = Math.min(Math.max(resX, minRange), maxRange);
      }
      else {
        if (resX - rect.x < tableColMinWidthPx) {
          resX = rect.x + tableColMinWidthPx;
        }
      }
      tipColBreak!.style.left = `${resX}px`;
      tipColBreak!.dataset.w = String(resX - rect.x);
    };
    const handleMouseup = () => {
      const w = Number.parseInt(tipColBreak!.dataset.w!);
      if (tableMainBlot.full) {
        let pre = (w / tableMainBlot.domNode.getBoundingClientRect().width) * 100;
        const oldWidthPre = cols[curColIndex].width;
        if (pre < oldWidthPre) {
          // minus
          // if not the last col. add the reduced amount to the next col
          // if is the last col. add the reduced amount to the pre col
          pre = Math.max(tableColMinWidthPre, pre);
          const last = oldWidthPre - pre;
          if (cols[curColIndex + 1]) {
            cols[curColIndex + 1].width = `${cols[curColIndex + 1].width + last}%`;
          }
          else if (cols[curColIndex - 1]) {
            cols[curColIndex - 1].width = `${cols[curColIndex - 1].width + last}%`;
          }
          else {
            pre = 100;
          }
          cols[curColIndex].width = `${pre}%`;
        }
        else {
          // magnify col
          // the last col can't magnify. control last but one minus to magnify last col
          if (cols[curColIndex + 1]) {
            const totalWidthNextPre = oldWidthPre + cols[curColIndex + 1].width;
            pre = Math.min(totalWidthNextPre - tableColMinWidthPre, pre);
            cols[curColIndex].width = `${pre}%`;
            cols[curColIndex + 1].width = `${totalWidthNextPre - pre}%`;
          }
        }
      }
      else {
        tableMainBlot.domNode.style.width = `${
          Number.parseFloat(tableMainBlot.domNode.style.width)
          - cols[curColIndex].domNode.getBoundingClientRect().width
          + w
        }px`;
        cols[curColIndex].width = `${w}px`;
      }

      document.body.removeChild(tipColBreak!);
      tipColBreak = null;
      document.removeEventListener('mouseup', handleMouseup);
      document.removeEventListener('mousemove', handleMousemove);
      this.dragging = false;
      this.updateColResizer(tableCellBlot);
    };
    const handleMousedown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      this.dragging = true;
      document.addEventListener('mouseup', handleMouseup);
      document.addEventListener('mousemove', handleMousemove);

      const divDom = document.createElement('div');
      divDom.classList.add('ql-table-drag-line');
      divDom.classList.add('col');

      // set drag init width
      const tableMainRect = tableMainBlot.domNode.getBoundingClientRect();
      const fullWidth = tableMainRect.width;
      const colWidthAttr = cols[curColIndex].width;
      const width = tableMainBlot.full ? colWidthAttr / 100 * fullWidth : colWidthAttr;
      divDom.dataset.w = String(width);

      Object.assign(divDom.style, {
        top: `${tableMainRect.y}px`,
        left: `${e.clientX}px`,
        height: `${tableMainRect.height}px`,
      });
      document.body.appendChild(divDom);

      if (tipColBreak) document.body.removeChild(tipColBreak);
      tipColBreak = divDom;
    };
    this.colResizer.addEventListener('mousedown', handleMousedown);
    this.colResizer.addEventListener('dragstart', (e) => {
      e.preventDefault();
    });
  }

  updateRowResizer(tableCellBlot: TableCellFormat) {
    this.quill.container.removeChild(this.rowResizer);
    this.rowResizer = this.quill.addContainer('ql-table-resize-line-row');
    const row = tableCellBlot.parent;
    if (!(row instanceof TableRowFormat)) {
      return;
    }

    const [tableBodyBlot, tableMainBlot] = findParentBlots(tableCellBlot, [blotName.tableBody, blotName.tableMain] as const);
    const tableBodynRect = tableBodyBlot.domNode.getBoundingClientRect();
    const tableCellRect = tableCellBlot.domNode.getBoundingClientRect();
    const rootRect = this.quill.root.getBoundingClientRect();
    Object.assign(this.rowResizer.style, {
      top: `${tableCellRect.bottom - rootRect.y}px`,
      left: `${tableBodynRect.x - rootRect.x}px`,
      width: `${tableBodynRect.width}px`,
    });

    let tipRowBreak: HTMLElement | null;
    const handleMousemove = (e: MouseEvent) => {
      const rect = tableCellBlot.parent.domNode.getBoundingClientRect();
      let resY = e.clientY;
      if (resY - rect.y < tableRowMinWidthPx) {
        resY = rect.y + tableRowMinWidthPx;
      }
      tipRowBreak!.style.top = `${resY}px`;
      tipRowBreak!.dataset.w = String(resY - rect.y);
    };
    const handleMouseup = () => {
      const w = Number.parseInt(tipRowBreak!.dataset.w!);
      (tableCellBlot.parent as TableRowFormat).setHeight(w);

      document.body.removeChild(tipRowBreak!);
      tipRowBreak = null;
      document.removeEventListener('mouseup', handleMouseup);
      document.removeEventListener('mousemove', handleMousemove);
      this.dragging = false;
      this.updateRowResizer(tableCellBlot);
    };
    const handleMousedown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      this.dragging = true;
      document.addEventListener('mouseup', handleMouseup);
      document.addEventListener('mousemove', handleMousemove);

      const divDom = document.createElement('div');
      divDom.classList.add('ql-table-drag-line');
      divDom.classList.add('row');

      // set drag init height
      const height = tableCellBlot.parent.domNode.getBoundingClientRect().height;
      divDom.dataset.w = String(height);

      const tableMainRect = tableMainBlot.domNode.getBoundingClientRect();
      Object.assign(divDom.style, {
        top: `${e.clientY}px`,
        left: `${tableMainRect.x}px`,
        width: `${tableMainRect.width}px`,
      });
      document.body.appendChild(divDom);

      if (tipRowBreak) document.body.removeChild(tipRowBreak);
      tipRowBreak = divDom;
    };
    this.rowResizer.addEventListener('mousedown', handleMousedown);
    this.rowResizer.addEventListener('dragstart', (e) => {
      e.preventDefault();
    });
  }

  showResizer() {
    Object.assign(this.colResizer.style, { display: null });
    Object.assign(this.rowResizer.style, { display: null });
  }

  hideResizer() {
    this.currentTableCell = undefined;
    this.rowResizer.style.display = 'none';
    this.colResizer.style.display = 'none';
  }
}
