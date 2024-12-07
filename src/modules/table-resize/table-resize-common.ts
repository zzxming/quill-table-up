import type Quill from 'quill';
import type { TableMainFormat } from '../../formats';
import { createButton, createDialog, tableUpEvent, tableUpSize } from '../../utils';
import { isTableAlignRight } from './utils';

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

  constructor(public quill: Quill) {}

  findCurrentColIndex(_e: MouseEvent) {
    return -1;
  }

  colWidthChange(_i: number, _w: number, _isFull: boolean) {}

  async createConfirmDialog() {
    return new Promise((resolve) => {
      const content = document.createElement('div');
      Object.assign(content.style, {
        padding: '8px 12px',
      });
      const tip = document.createElement('p');
      tip.textContent = '半分比宽度不足, 如需完成操作需要转换表格为固定宽度，是否继续?';
      const btnWrapper = document.createElement('div');
      Object.assign(btnWrapper.style, {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: `6px`,
      });
      const cancelBtn = createButton({ content: '取消' });
      const confirmBtn = createButton({ type: 'confirm', content: '确认' });

      btnWrapper.appendChild(cancelBtn);
      btnWrapper.appendChild(confirmBtn);
      content.appendChild(tip);
      content.appendChild(btnWrapper);

      const { close } = createDialog({ child: content });

      cancelBtn.addEventListener('click', () => {
        resolve(false);
        close();
      });
      confirmBtn.addEventListener('click', () => {
        resolve(true);
        close();
      });
    });
  }

  async handleColMouseUp() {
    if (!this.dragColBreak || !this.tableMain || this.colIndex === -1) return;
    const cols = this.tableMain.getCols();
    const w = Number.parseInt(this.dragColBreak.dataset.w || '0');
    const isFull = this.tableMain.full;
    let needUpdate = false;
    const updateInfo: { index: number; width: number; full: boolean }[] = [];
    if (isFull) {
      const tableMainWidth = this.tableMain.domNode.getBoundingClientRect().width;
      let pre = (w / tableMainWidth) * 100;
      const oldWidthPre = cols[this.colIndex].width;
      if (pre < oldWidthPre) {
        // minus
        // if not the last col. add the reduced amount to the next col
        // if is the last col. add the reduced amount to the pre col
        pre = Math.max(tableUpSize.colMinWidthPre, pre);
        if (cols[this.colIndex + 1] || cols[this.colIndex - 1]) {
          const i = cols[this.colIndex + 1] ? this.colIndex + 1 : this.colIndex - 1;
          updateInfo.push({ index: i, width: cols[i].width + oldWidthPre - pre, full: isFull });
        }
        else {
          pre = 100;
        }
        needUpdate = true;
        updateInfo.push({ index: this.colIndex, width: pre, full: isFull });
      }
      else {
        // magnify col
        // the last col can't magnify. control last but one minus to magnify last col
        if (cols[this.colIndex + 1]) {
          const totalWidthNextPre = oldWidthPre + cols[this.colIndex + 1].width;
          pre = Math.min(totalWidthNextPre - tableUpSize.colMinWidthPre, pre);
          needUpdate = true;
          updateInfo.push(
            { index: this.colIndex, width: pre, full: isFull },
            { index: this.colIndex + 1, width: totalWidthNextPre - pre, full: isFull },
          );
        }
      }
    }
    else {
      this.tableMain.domNode.style.width = `${
        Number.parseFloat(this.tableMain.domNode.style.width)
        - cols[this.colIndex].domNode.getBoundingClientRect().width
        + w
      }px`;
      needUpdate = true;
      updateInfo.push({ index: this.colIndex, width: w, full: isFull });
    }

    document.body.removeChild(this.dragColBreak);
    this.dragColBreak = null;
    document.removeEventListener('mouseup', this.handleColMouseUpFunc);
    document.removeEventListener('mousemove', this.handleColMouseMoveFunc);
    this.dragging = false;

    // update col width
    let updated = true;
    if (needUpdate) {
      for (let { index, width, full } of updateInfo) {
        // table full maybe change. every time update need check data full and transform width
        const tableWidth = this.tableMain.domNode.getBoundingClientRect().width;
        let isFull = this.tableMain.full;
        if (full !== isFull) {
          if (full === true && isFull === false) {
            width = width / 100 * tableWidth;
          }
          else if (full === false && isFull === true) {
            width = width / tableWidth * 100;
          }
        }
        // if tableis full and width larger then 100. check user want to change table to fixed width
        if (isFull) {
          const totalWidth = cols.reduce((total, cur, i) => {
            total += i === index ? width : cur.width;
            return total;
          }, 0);
          if (totalWidth > 100) {
            if (!await this.createConfirmDialog()) {
              updated = false;
              break;
            }
            this.tableMain.cancelFull();
            isFull = false;
            width = width / 100 * tableWidth;
          }
        }
        cols[index].width = `${width}${isFull ? '%' : 'px'}`;
        this.colWidthChange(index, isFull ? width / 100 * tableWidth : width, isFull);
      }
    }

    if (updated) {
      this.quill.emitter.emit(tableUpEvent.AFTER_TABLE_RESIZE);
    }
  };

  handleColMouseMove(e: MouseEvent): { left: number; width: number } | undefined {
    e.preventDefault();
    if (!this.dragColBreak || !this.tableMain || this.colIndex === -1) return;
    const cols = this.tableMain.getCols();
    const changeColRect = cols[this.colIndex].domNode.getBoundingClientRect();
    const tableRect = this.tableMain.domNode.getBoundingClientRect();
    let resX = e.clientX;

    // table full not handle align right
    if (this.tableMain.full) {
      // max width = current col.width + next col.width
      // if current col is last. max width = current col.width
      const minWidth = (tableUpSize.colMinWidthPre / 100) * tableRect.width;
      let maxRange = tableRect.right;
      if (resX > changeColRect.right && cols[this.colIndex + 1]) {
        maxRange = Math.max(cols[this.colIndex + 1].domNode.getBoundingClientRect().right - minWidth, changeColRect.left + minWidth);
      }
      const minRange = changeColRect.x + minWidth;
      resX = Math.min(Math.max(resX, minRange), maxRange);
    }
    else {
      // when table align right, mousemove to the left, the col width will be increase
      if (isTableAlignRight(this.tableMain)) {
        if (changeColRect.right - resX < tableUpSize.colMinWidthPx) {
          resX = changeColRect.right - tableUpSize.colMinWidthPx;
        }
      }
      else {
        if (resX - changeColRect.x < tableUpSize.colMinWidthPx) {
          resX = changeColRect.x + tableUpSize.colMinWidthPx;
        }
      }
    }

    let width = resX - changeColRect.x;
    if (isTableAlignRight(this.tableMain)) {
      width = changeColRect.right - resX;
    }
    this.dragColBreak.style.left = `${resX}px`;
    this.dragColBreak.dataset.w = String(width);
    return {
      left: resX,
      width,
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
