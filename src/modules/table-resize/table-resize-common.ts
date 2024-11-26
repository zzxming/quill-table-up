import type Quill from 'quill';
import type { TableMainFormat } from '../../formats';
import { tableUpEvent, tableUpSize } from '../../utils';

export class TableResizeCommon {
  colIndex: number = -1;
  tableMain?: TableMainFormat;
  dragging = false;
  dragColBreak: HTMLElement | null = null;
  handleColMouseUpFunc = this.handleColMouseUp.bind(this);
  handleColMouseMoveFunc = this.handleColMouseMove.bind(this);
  handleColMouseDownFunc = this.handleColMouseDown.bind(this);

  rowIndex: number = -1;
  dragRowBreak: HTMLElement | null = null;
  handleRowMouseUpFunc = this.handleRowMouseUp.bind(this);
  handleRowMouseMoveFunc = this.handleRowMouseMove.bind(this);
  handleRowMouseDownFunc = this.handleRowMouseDown.bind(this);

  constructor(public quill: Quill) {
  }

  findCurrentColIndex(_e: MouseEvent) {
    return -1;
  }

  colWidthChange(_i: number, _w: number, _isFull: boolean) {}

  handleColMouseUp() {
    if (!this.dragColBreak || !this.tableMain || this.colIndex === -1) return;
    const cols = this.tableMain.getCols();
    const w = Number.parseInt(this.dragColBreak.dataset.w || '0');
    const isFull = this.tableMain.full;
    if (isFull) {
      let pre = (w / this.tableMain.domNode.getBoundingClientRect().width) * 100;
      const oldWidthPre = cols[this.colIndex].width;
      if (pre < oldWidthPre) {
        // minus
        // if not the last col. add the reduced amount to the next col
        // if is the last col. add the reduced amount to the pre col
        pre = Math.max(tableUpSize.colMinWidthPre, pre);
        if (cols[this.colIndex + 1] || cols[this.colIndex - 1]) {
          const i = cols[this.colIndex + 1] ? this.colIndex + 1 : this.colIndex - 1;
          const changeTableCol = cols[i];
          const resultWidth = changeTableCol.width + oldWidthPre - pre;
          changeTableCol.width = `${resultWidth}%`;
          this.colWidthChange(i, resultWidth, isFull);
        }
        else {
          pre = 100;
        }
        cols[this.colIndex].width = `${pre}%`;
        this.colWidthChange(this.colIndex, pre, isFull);
      }
      else {
        // magnify col
        // the last col can't magnify. control last but one minus to magnify last col
        if (cols[this.colIndex + 1]) {
          const totalWidthNextPre = oldWidthPre + cols[this.colIndex + 1].width;
          pre = Math.min(totalWidthNextPre - tableUpSize.colMinWidthPre, pre);
          cols[this.colIndex].width = `${pre}%`;
          this.colWidthChange(this.colIndex, pre, isFull);
          cols[this.colIndex + 1].width = `${totalWidthNextPre - pre}%`;
          this.colWidthChange(this.colIndex + 1, totalWidthNextPre - pre, isFull);
        }
      }
    }
    else {
      this.tableMain.domNode.style.width = `${
        Number.parseFloat(this.tableMain.domNode.style.width)
        - cols[this.colIndex].domNode.getBoundingClientRect().width
        + w
      }px`;
      cols[this.colIndex].width = `${w}px`;
      this.colWidthChange(this.colIndex, w, isFull);
    }

    document.body.removeChild(this.dragColBreak);
    this.dragColBreak = null;
    document.removeEventListener('mouseup', this.handleColMouseUpFunc);
    document.removeEventListener('mousemove', this.handleColMouseMoveFunc);
    this.dragging = false;
    this.quill.emitter.emit(tableUpEvent.AFTER_TABLE_RESIZE);
  };

  handleColMouseMove(e: MouseEvent): { left: number; width: number } | undefined {
    e.preventDefault();
    if (!this.dragColBreak || !this.tableMain || this.colIndex === -1) return;
    const cols = this.tableMain.getCols();
    const rect = cols[this.colIndex].domNode.getBoundingClientRect();
    const tableRect = this.tableMain.domNode.getBoundingClientRect();
    let resX = e.clientX;

    if (this.tableMain.full) {
      // max width = current col.width + next col.width
      // if current col is last. max width = current col.width
      const minWidth = (tableUpSize.colMinWidthPre / 100) * tableRect.width;
      let maxRange = tableRect.right;
      if (resX > rect.right && cols[this.colIndex + 1]) {
        maxRange = Math.max(cols[this.colIndex + 1].domNode.getBoundingClientRect().right - minWidth, rect.left + minWidth);
      }
      const minRange = rect.x + minWidth;
      resX = Math.min(Math.max(resX, minRange), maxRange);
    }
    else {
      if (resX - rect.x < tableUpSize.colMinWidthPx) {
        resX = rect.x + tableUpSize.colMinWidthPx;
      }
    }
    this.dragColBreak.style.left = `${resX}px`;
    this.dragColBreak.dataset.w = String(resX - rect.x);
    return {
      left: resX,
      width: resX - rect.x,
    };
  };

  handleColMouseDown(e: MouseEvent): { top: number; left: number; height: number } | undefined {
    if (e.button !== 0) return;
    e.preventDefault();
    if (!this.tableMain) return;
    // set drag init width
    const cols = this.tableMain.getCols();
    const tableMainRect = this.tableMain.domNode.getBoundingClientRect();
    const fullWidth = tableMainRect.width;
    this.colIndex = this.findCurrentColIndex(e);
    if (this.colIndex === -1) return;
    const colWidthAttr = cols[this.colIndex].width;
    const width = this.tableMain.full ? colWidthAttr / 100 * fullWidth : colWidthAttr;

    // if the column already smaller than min width, don't allow drag
    if (this.tableMain.full) {
      if (colWidthAttr < tableUpSize.colMinWidthPre) {
        return;
      }
    }
    else {
      if (width < tableUpSize.colMinWidthPx) {
        return;
      }
    }

    document.addEventListener('mouseup', this.handleColMouseUpFunc);
    document.addEventListener('mousemove', this.handleColMouseMoveFunc);

    this.dragging = true;

    const divDom = document.createElement('div');
    divDom.classList.add('ql-table-drag-line');
    divDom.classList.add('col');
    divDom.dataset.w = String(width);

    const styleValue = {
      top: tableMainRect.y,
      left: e.clientX,
      height: tableMainRect.height,
    };
    Object.assign(divDom.style, {
      top: `${styleValue.top}px`,
      left: `${styleValue.left}px`,
      height: `${styleValue.height}px`,
    });
    const appendTo = document.body;
    appendTo.appendChild(divDom);

    if (this.dragColBreak) appendTo.removeChild(this.dragColBreak);
    this.dragColBreak = divDom;

    return styleValue;
  };

  findCurrentRowIndex(_e: MouseEvent) {
    return -1;
  }

  rowHeightChange(_i: number, _h: number) {}

  handleRowMouseUp() {
    if (!this.tableMain || !this.dragRowBreak || this.rowIndex === -1) return;
    const h = Number.parseInt(this.dragRowBreak.dataset.h || '0');

    const rows = this.tableMain.getRows();
    rows[this.rowIndex].setHeight(`${h}px`);
    this.rowHeightChange(this.rowIndex, h);

    document.body.removeChild(this.dragRowBreak);
    this.dragRowBreak = null;
    document.removeEventListener('mouseup', this.handleRowMouseUpFunc);
    document.removeEventListener('mousemove', this.handleRowMouseMoveFunc);
    this.dragging = false;
    this.quill.emitter.emit(tableUpEvent.AFTER_TABLE_RESIZE);
  }

  handleRowMouseMove(e: MouseEvent): { top: number; height: number } | undefined {
    if (!this.tableMain || !this.dragRowBreak || this.rowIndex === -1) return;
    e.preventDefault();
    const rows = this.tableMain.getRows();
    const rect = rows[this.rowIndex].domNode.getBoundingClientRect();
    let resY = e.clientY;
    if (resY - rect.y < tableUpSize.rowMinHeightPx) {
      resY = rect.y + tableUpSize.rowMinHeightPx;
    }
    this.dragRowBreak.style.top = `${resY}px`;
    this.dragRowBreak.dataset.h = String(resY - rect.y);
    return {
      top: resY,
      height: resY - rect.y,
    };
  }

  handleRowMouseDown(e: MouseEvent): { top: number; left: number; width: number } | undefined {
    if (e.button !== 0) return;
    e.preventDefault();
    if (!this.tableMain) return;

    this.rowIndex = this.findCurrentRowIndex(e);
    if (this.rowIndex === -1) return;

    this.dragging = true;
    document.addEventListener('mouseup', this.handleRowMouseUpFunc);
    document.addEventListener('mousemove', this.handleRowMouseMoveFunc);

    const rows = this.tableMain.getRows();

    // set drag init width
    const height = rows[this.rowIndex].domNode.getBoundingClientRect().height;
    const tableMainRect = this.tableMain?.domNode.getBoundingClientRect();

    const divDom = document.createElement('div');
    divDom.classList.add('ql-table-drag-line');
    divDom.classList.add('row');
    divDom.dataset.h = String(height);

    const styleValue = {
      top: e.clientY,
      left: tableMainRect.x,
      width: tableMainRect.width,
    };
    Object.assign(divDom.style, {
      top: `${styleValue.top}px`,
      left: `${styleValue.left}px`,
      width: `${styleValue.width}px`,
    });
    const appendTo = document.body;
    appendTo.appendChild(divDom);

    if (this.dragRowBreak) appendTo.removeChild(this.dragRowBreak);
    this.dragRowBreak = divDom;

    return styleValue;
  };

  update() {}
  destroy() {}
}
