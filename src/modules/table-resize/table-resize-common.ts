import type Quill from 'quill';
import type { TableMainFormat } from '../../formats';
import type { TableUp } from '../../table-up';
import { getTableMainRect } from '../../formats';
import { createBEM, createButton, createDialog, tableUpEvent, tableUpSize } from '../../utils';
import { TableDomSelector } from '../table-dom-selector';
import { isTableAlignRight } from './utils';

export interface sizeChangeValue {
  px: number;
  pre: number;
}
export class TableResizeCommon extends TableDomSelector {
  static moduleName = 'table-resize';

  colIndex: number = -1;
  tableBlot?: TableMainFormat;
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

  constructor(public tableModule: TableUp, public quill: Quill) {
    super(tableModule, quill);
  }

  findCurrentColIndex(_e: MouseEvent) {
    return -1;
  }

  colWidthChange(_i: number, _w: sizeChangeValue, _isFull: boolean) {}

  async createConfirmDialog({ message, confirm, cancel }: {
    message: string;
    confirm: string;
    cancel: string;
  }) {
    return new Promise<boolean>((resolve) => {
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
    if (!this.dragColBreak || !this.tableBlot || this.colIndex === -1) return;
    const cols = this.tableBlot.getCols();
    const w = Number.parseInt(this.dragColBreak.dataset.w || '0');
    let isFull = this.tableBlot.full;
    let needUpdate = false;
    const updateInfo: { index: number; width: number }[] = [];
    if (isFull) {
      const tableMainWidth = this.tableBlot.domNode.getBoundingClientRect().width;
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
      this.tableBlot.domNode.style.width = `${
        Number.parseFloat(this.tableBlot.domNode.style.width)
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
      const tableWidth = this.tableBlot.domNode.getBoundingClientRect().width;
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
          this.tableBlot.cancelFull();
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
        cols[index].width = `${Math.round(width)}${isFull ? '%' : 'px'}`;
        this.colWidthChange(
          index,
          {
            px: isFull ? Math.round(width / 100 * tableWidth) : Math.round(width),
            pre: Math.round(width),
          },
          isFull,
        );
      }
    }

    this.quill.emitter.emit(tableUpEvent.AFTER_TABLE_RESIZE);
  }

  // fix browser compatibility, get column rect left/x inaccurate
  getColumnRect(columnIndex: number) {
    if (!this.tableBlot) return null;
    const cols = this.tableBlot.getCols();
    if (columnIndex >= cols.length) return null;

    // calculate column position
    let left = cols[0].domNode.getBoundingClientRect().left;
    for (let i = 0; i < columnIndex; i++) {
      const colRect = cols[i].domNode.getBoundingClientRect();
      left += colRect.width;
    }

    const currentCol = cols[columnIndex];
    const colWidth = currentCol.domNode.getBoundingClientRect().width;

    return {
      left,
      right: left + colWidth,
      width: colWidth,
    };
  }

  handleColMouseMove(e: MouseEvent): { left: number; width: number } | undefined {
    e.preventDefault();
    if (!this.dragColBreak || !this.tableBlot || this.colIndex === -1) return;
    const cols = this.tableBlot.getCols();
    const changeColRect = this.getColumnRect(this.colIndex)!;
    const tableRect = this.tableBlot.domNode.getBoundingClientRect();
    let resX = e.clientX;

    // table full not handle align right
    if (this.tableBlot.full) {
      // max width = current col.width + next col.width
      // if current col is last. max width = current col.width
      const minWidth = (tableUpSize.colMinWidthPre / 100) * tableRect.width;
      let maxRange = tableRect.right;
      if (resX > changeColRect.right && cols[this.colIndex + 1]) {
        maxRange = Math.max(this.getColumnRect(this.colIndex + 1)!.right - minWidth, changeColRect.left + minWidth);
      }
      const minRange = changeColRect.left + minWidth;
      resX = Math.min(Math.max(resX, minRange), maxRange);
    }
    else {
      // when table align right, mousemove to the left, the col width will be increase
      if (isTableAlignRight(this.tableBlot)) {
        if (changeColRect.right - resX < tableUpSize.colMinWidthPx) {
          resX = changeColRect.right - tableUpSize.colMinWidthPx;
        }
      }
      else {
        if (resX - changeColRect.left < tableUpSize.colMinWidthPx) {
          resX = changeColRect.left + tableUpSize.colMinWidthPx;
        }
      }
    }

    let width = resX - changeColRect.left;
    if (isTableAlignRight(this.tableBlot)) {
      width = changeColRect.right - resX;
    }
    this.dragColBreak.style.left = `${resX}px`;
    this.dragColBreak.dataset.w = String(width);
    return {
      left: resX,
      width,
    };
  }

  handleColMouseDown(e: MouseEvent): { top: number; left: number; height: number } | undefined {
    if (e.button !== 0) return;
    e.preventDefault();
    if (!this.tableBlot) return;
    const { rect: tableRect, body: tableBodyBlot } = getTableMainRect(this.tableBlot);
    if (!tableBodyBlot || !tableRect) return;
    // set drag init width
    const cols = this.tableBlot.getCols();
    this.colIndex = this.findCurrentColIndex(e);
    if (this.colIndex === -1) return;
    const colWidthAttr = cols[this.colIndex].width;
    const width = this.tableBlot.full ? colWidthAttr / 100 * tableRect.width : colWidthAttr;

    document.addEventListener('mouseup', this.handleColMouseUpFunc);
    document.addEventListener('mousemove', this.handleColMouseMoveFunc);

    this.dragging = true;

    const divDom = document.createElement('div');
    divDom.classList.add(this.dragBEM.b(), this.dragBEM.is('col'));
    divDom.dataset.w = String(width);

    const styleValue = {
      top: tableRect.y,
      left: e.clientX,
      height: tableRect.height,
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
  }

  findCurrentRowIndex(_e: MouseEvent) {
    return -1;
  }

  rowHeightChange(_i: number, _h: number) {}

  handleRowMouseUp() {
    if (!this.tableBlot || !this.dragRowBreak || this.rowIndex === -1) return;
    const h = Number.parseInt(this.dragRowBreak.dataset.h || '0');

    const rows = this.tableBlot.getRows();
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
    if (!this.tableBlot || !this.dragRowBreak || this.rowIndex === -1) return;
    e.preventDefault();
    const rows = this.tableBlot.getRows();
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
    if (!this.tableBlot) return;

    this.rowIndex = this.findCurrentRowIndex(e);
    if (this.rowIndex === -1) return;

    this.dragging = true;
    document.addEventListener('mouseup', this.handleRowMouseUpFunc);
    document.addEventListener('mousemove', this.handleRowMouseMoveFunc);

    const rows = this.tableBlot.getRows();

    // set drag init width
    const height = rows[this.rowIndex].domNode.getBoundingClientRect().height;
    const tableMainRect = this.tableBlot.domNode.getBoundingClientRect();

    const divDom = document.createElement('div');
    divDom.classList.add(this.dragBEM.b(), this.dragBEM.is('row'));
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
  }

  update() {}
  destroy() {}
}
