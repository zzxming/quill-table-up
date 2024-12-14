import type Quill from 'quill';
import type TableUp from '../..';
import type { TableMainFormat } from '../../formats';
import { createBEM, createButton, createDialog, tableUpEvent, tableUpSize } from '../../utils';
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

  dragBEM = createBEM('drag-line');

  constructor(public tableModule: TableUp, public quill: Quill) {}

  findCurrentColIndex(_e: MouseEvent) {
    return -1;
  }

  colWidthChange(_i: number, _w: number, _isFull: boolean) {}

  async createConfirmDialog({ message, confirm, cancel }: {
    message: string;
    confirm: string;
    cancel: string;
  }) {
    return new Promise((resolve) => {
      const content = document.createElement('div');
      Object.assign(content.style, {
        padding: '8px 12px',
        fontSize: '14px',
        lineHeight: '1.5',
      });
      const tip = document.createElement('p');
      tip.textContent = message;
      const btnWrapper = document.createElement('div');
      Object.assign(btnWrapper.style, {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: `6px`,
      });
      const cancelBtn = createButton({ content: cancel });
      const confirmBtn = createButton({ type: 'confirm', content: confirm });

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
    let isFull = this.tableMain.full;
    let needUpdate = false;
    const updateInfo: { index: number; width: number }[] = [];
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
          updateInfo.push({ index: i, width: cols[i].width + oldWidthPre - pre });
        }
        else {
          pre = 100;
        }
        needUpdate = true;
        updateInfo.push({ index: this.colIndex, width: pre });
      }
      else {
        // magnify col
        // the last col can't magnify. control last but one minus to magnify last col
        if (cols[this.colIndex + 1]) {
          const totalWidthNextPre = oldWidthPre + cols[this.colIndex + 1].width;
          pre = Math.min(totalWidthNextPre - tableUpSize.colMinWidthPre, pre);
          needUpdate = true;
          updateInfo.push(
            { index: this.colIndex, width: pre },
            { index: this.colIndex + 1, width: totalWidthNextPre - pre },
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
      updateInfo.push({ index: this.colIndex, width: w });
    }

    document.body.removeChild(this.dragColBreak);
    this.dragColBreak = null;
    document.removeEventListener('mouseup', this.handleColMouseUpFunc);
    document.removeEventListener('mousemove', this.handleColMouseMoveFunc);
    this.dragging = false;

    if (needUpdate) {
      const tableWidth = this.tableMain.domNode.getBoundingClientRect().width;
      if (isFull) {
        // if full table and percentage width is larger than 100%. check if convert to fixed px
        let resultWidth = 0;
        const skipColIndex = new Set(updateInfo.map(({ index, width }) => {
          resultWidth += width;
          return index;
        }));
        for (const [index, col] of cols.entries()) {
          if (skipColIndex.has(index)) continue;
          resultWidth += col.width;
        }

        if (resultWidth > 100) {
          if (!await this.createConfirmDialog({
            message: this.tableModule.options.texts.perWidthInsufficient,
            confirm: this.tableModule.options.texts.confirmText,
            cancel: this.tableModule.options.texts.cancelText,
          })) {
            return;
          }
          this.tableMain.cancelFull();
          isFull = false;
          for (const [i, info] of updateInfo.entries()) {
            const { width, index } = info;
            updateInfo[i] = {
              index,
              width: width / 100 * tableWidth,
            };
          }
        }
      }

      for (const { index, width } of updateInfo) {
        cols[index].width = `${width}${isFull ? '%' : 'px'}`;
        this.colWidthChange(index, isFull ? width / 100 * tableWidth : width, isFull);
      }
    }

    this.quill.emitter.emit(tableUpEvent.AFTER_TABLE_RESIZE);
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
    divDom.classList.add(this.dragBEM.b());
    divDom.classList.add(this.dragBEM.is('col'));
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
    divDom.classList.add(this.dragBEM.b());
    divDom.classList.add(this.dragBEM.is('row'));
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
