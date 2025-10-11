import type Quill from 'quill';
import type { TableColFormat, TableMainFormat, TableRowFormat } from '../../formats';
import type { TableUp } from '../../table-up';
import { getTableMainRect } from '../../formats';
import { createBEM, createConfirmDialog, tableUpEvent, tableUpSize } from '../../utils';
import { TableDomSelector } from '../table-dom-selector';
import { getColRect, isTableAlignRight } from './utils';

export class TableResizeCommon extends TableDomSelector {
  tableBlot?: TableMainFormat;
  dragBEM = createBEM('drag');
  dragging = false;
  colIndex: number = -1;
  rowIndex: number = -1;
  maxColLeft: number = Number.POSITIVE_INFINITY;
  minColLeft: number = Number.NEGATIVE_INFINITY;
  maxRowTop: number = Number.POSITIVE_INFINITY;
  minRowTop: number = Number.NEGATIVE_INFINITY;
  startX: number = 0;
  startY: number = 0;
  dragColBreak: HTMLElement | null = null;
  dragRowBreak: HTMLElement | null = null;

  constructor(public tableModule: TableUp, public quill: Quill) {
    super(tableModule, quill);
  }

  findDragColIndex(_cols: TableColFormat[]) {
    // implementation is required
    return -1;
  }

  createColBreak() {
    if (this.dragColBreak) this.dragColBreak.remove();
    this.dragColBreak = this.tableModule.addContainer(this.dragBEM.be('line'));
    this.dragColBreak.classList.add(this.dragBEM.is('col'));
  }

  calculateColDragRange() {
    if (!this.tableBlot) return;
    const { rect: tableRect } = getTableMainRect(this.tableBlot);
    if (!tableRect) return;
    const cols = this.tableBlot.getCols();
    this.colIndex = this.findDragColIndex(cols);
    if (this.colIndex === -1) return;
    const changeColRect = getColRect(cols, this.colIndex)!;
    if (this.tableBlot.full) {
      // table full not handle align right
      // max width = current col.width + next col.width - minColLeft
      const minWidth = (tableUpSize.colMinWidthPre / 100) * tableRect.width;
      // if current col is last. max width = current col.width
      let maxRange = tableRect.right;
      if (cols[this.colIndex + 1]) {
        maxRange = Math.max(getColRect(cols, this.colIndex + 1)!.right - minWidth, changeColRect.left + minWidth);
      }
      const minRange = changeColRect.left + minWidth;
      this.minColLeft = minRange;
      this.maxColLeft = maxRange;
    }
    else {
      // when table align right, mousemove to the left, the col width will be increase
      this.minColLeft = isTableAlignRight(this.tableBlot)
        ? changeColRect.right - tableUpSize.colMinWidthPx
        : changeColRect.left + tableUpSize.colMinWidthPx;
      this.maxColLeft = Number.POSITIVE_INFINITY;
    }
  }

  limitColLeft(left: number) {
    // position base viewport. offset minus the scroll distance when dragging
    let offset = 0;
    const { rect: tableRect } = getTableMainRect(this.tableBlot!);
    if (tableRect) {
      offset = tableRect.x - this.startX;
    }
    return Math.min(this.maxColLeft + offset, Math.max(left, this.minColLeft + offset));
  }

  async updateTableCol(left: number) {
    if (!this.tableBlot || this.colIndex === -1) return;
    const resultX = this.limitColLeft(left);
    const cols = this.tableBlot.getCols();
    const changeColRect = getColRect(cols, this.colIndex)!;
    let width = resultX - changeColRect.left;
    if (isTableAlignRight(this.tableBlot)) {
      width = changeColRect.right - resultX;
    }
    let isFull = this.tableBlot.full;
    let needUpdate = false;
    const updateInfo: { index: number; width: number }[] = [];
    if (isFull) {
      const { rect } = getTableMainRect(this.tableBlot);
      const tableMainWidth = rect!.width;
      let pre = (width / tableMainWidth) * 100;
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
        + width
      }px`;
      needUpdate = true;
      updateInfo.push({ index: this.colIndex, width });
    }

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
          if (!await createConfirmDialog({
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
        const resultWidth = Number.parseFloat(width.toFixed(3));
        cols[index].width = `${resultWidth}${isFull ? '%' : 'px'}`;
      }
      this.quill.emitter.emit(tableUpEvent.AFTER_TABLE_RESIZE);
    }
  }

  findDragRowIndex(_rows: TableRowFormat[]) {
    // implementation is required
    return -1;
  }

  createRowBreak() {
    if (this.dragRowBreak) this.dragRowBreak.remove();
    this.dragRowBreak = this.tableModule.addContainer(this.dragBEM.be('line'));
    this.dragRowBreak.classList.add(this.dragBEM.is('row'));
  }

  calculateRowDragRange() {
    if (!this.tableBlot) return;
    const rows = this.tableBlot.getRows();
    this.rowIndex = this.findDragRowIndex(rows);
    if (this.rowIndex === -1) return;
    const rect = rows[this.rowIndex].domNode.getBoundingClientRect();
    this.minRowTop = rect.y + tableUpSize.rowMinHeightPx;
    this.maxRowTop = Number.POSITIVE_INFINITY;
  }

  limitRowTop(top: number) {
    // position base viewport. offset minus the scroll distance when dragging
    let offset = 0;
    const { rect: tableRect } = getTableMainRect(this.tableBlot!);
    if (tableRect) {
      offset = tableRect.y - this.startY;
    }
    return Math.min(this.maxRowTop + offset, Math.max(top, this.minRowTop + offset));
  }

  updateTableRow(top: number) {
    if (!this.tableBlot || this.rowIndex === -1) return;
    const resultY = this.limitRowTop(top);
    const rows = this.tableBlot.getRows();
    const changeRowRect = rows[this.rowIndex].domNode.getBoundingClientRect();
    const height = resultY - changeRowRect.top;
    rows[this.rowIndex].setHeight(`${height}px`);
    this.quill.emitter.emit(tableUpEvent.AFTER_TABLE_RESIZE);
  }

  removeBreak() {
    if (this.dragColBreak) {
      this.dragColBreak.remove();
      this.dragColBreak = null;
    }
    if (this.dragRowBreak) {
      this.dragRowBreak.remove();
      this.dragRowBreak = null;
    }
  }
}
