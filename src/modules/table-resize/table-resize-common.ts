import type Quill from 'quill';
import type { TableColFormat, TableMainFormat, TableRowFormat } from '../../formats';
import type { TableUp } from '../../table-up';
import { getTableMainRect } from '../../formats';
import { createBEM, createConfirmDialog, tableUpEvent, tableUpSize } from '../../utils';
import { TableDomSelector } from '../table-dom-selector';
import { getColRect, isTableAlignRight } from './utils';

export class TableResizeCommonHelper {
  maxRange: number = Number.POSITIVE_INFINITY;
  minRange: number = Number.NEGATIVE_INFINITY;
  startValue: number = 0;
  dragBEM = createBEM('drag');
  dragBreak: HTMLElement | null = null;
  tableModule: TableUp;
  isX: boolean = false;

  constructor(tableModule: TableUp, isX: boolean) {
    this.tableModule = tableModule;
    this.isX = isX;
  }

  createBreak() {
    if (this.dragBreak) this.dragBreak.remove();
    this.dragBreak = this.tableModule.addContainer(this.dragBEM.be('line'));
    this.dragBreak.classList.add(this.dragBEM.is(this.isX ? 'col' : 'row'));
  }

  getOffsetFromStart(tableBlot?: TableMainFormat) {
    let offset = 0;
    if (!tableBlot) return offset;
    const { rect: tableRect } = getTableMainRect(tableBlot);
    if (tableRect) {
      offset = tableRect[this.isX ? 'x' : 'y'] - this.startValue;
    }
    return offset;
  }

  limitRange(tableBlot: TableMainFormat | undefined, value: number, countScroll: boolean = true) {
    // position base viewport. offset minus the scroll distance when dragging
    let offset = 0;
    if (countScroll) {
      offset = this.getOffsetFromStart(tableBlot);
    }
    return Math.min(this.maxRange + offset, Math.max(value, this.minRange + offset));
  }
}

export class TableResizeCommon extends TableDomSelector {
  tableBlot?: TableMainFormat;
  dragging = false;
  colIndex: number = -1;
  rowIndex: number = -1;
  dragXCommon: TableResizeCommonHelper;
  dragYCommon: TableResizeCommonHelper;
  constructor(public tableModule: TableUp, public quill: Quill) {
    super(tableModule, quill);

    this.dragXCommon = new TableResizeCommonHelper(tableModule, true);
    this.dragYCommon = new TableResizeCommonHelper(tableModule, false);
  }

  findDragColIndex(_cols: TableColFormat[]) {
    // implementation is required
    return -1;
  }

  calculateColDragRangeByFull() {
    if (!this.tableBlot) return;
    const { rect: tableRect } = getTableMainRect(this.tableBlot);
    if (!tableRect) return;
    const cols = this.tableBlot.getCols();
    this.colIndex = this.findDragColIndex(cols);
    if (this.colIndex === -1) return;
    const changeColRect = getColRect(cols, this.colIndex)!;
    // table full not handle align right
    // max width = current col.width + next col.width - minColLeft
    const minWidth = (tableUpSize.colMinWidthPre / 100) * tableRect.width;
    // if current col is last. max width = current col.width
    let maxRange = tableRect.right;
    if (cols[this.colIndex + 1]) {
      maxRange = Math.max(getColRect(cols, this.colIndex + 1)!.right - minWidth, changeColRect.left + minWidth);
    }
    const minRange = changeColRect.left + minWidth;
    this.dragXCommon.minRange = minRange;
    this.dragXCommon.maxRange = maxRange;
  }

  calculateColDragRangeByFixed() {
    if (!this.tableBlot) return;
    const cols = this.tableBlot.getCols();
    this.colIndex = this.findDragColIndex(cols);
    if (this.colIndex === -1) return;
    const changeColRect = getColRect(cols, this.colIndex)!;
    // when table align right, mousemove to the left, the col width will be increase
    this.dragXCommon.minRange = isTableAlignRight(this.tableBlot)
      ? changeColRect.right - tableUpSize.colMinWidthPx
      : changeColRect.left + tableUpSize.colMinWidthPx;
    this.dragXCommon.maxRange = Number.POSITIVE_INFINITY;
  }

  calculateColDragRange() {
    if (!this.tableBlot) return;
    if (this.tableBlot.full) {
      this.calculateColDragRangeByFull();
    }
    else {
      this.calculateColDragRangeByFixed();
    }
  }

  async updateTableCol(left: number) {
    if (!this.tableBlot || this.colIndex === -1) return;
    const resultX = this.dragXCommon.limitRange(this.tableBlot, left, true);
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

  calculateRowDragRange() {
    // currently full or fixed doesn't effect row drag
    if (!this.tableBlot) return;
    const rows = this.tableBlot.getRows();
    this.rowIndex = this.findDragRowIndex(rows);
    if (this.rowIndex === -1) return;
    const rect = rows[this.rowIndex].domNode.getBoundingClientRect();
    this.dragYCommon.minRange = rect.y + tableUpSize.rowMinHeightPx;
    this.dragYCommon.maxRange = Number.POSITIVE_INFINITY;
  }

  updateTableRow(top: number) {
    if (!this.tableBlot || this.rowIndex === -1) return;
    const resultY = this.dragYCommon.limitRange(this.tableBlot, top, true);
    const rows = this.tableBlot.getRows();
    const changeRowRect = rows[this.rowIndex].domNode.getBoundingClientRect();
    const height = resultY - changeRowRect.top;
    rows[this.rowIndex].setHeight(`${height}px`);
    this.quill.emitter.emit(tableUpEvent.AFTER_TABLE_RESIZE);
  }

  removeBreak() {
    if (this.dragXCommon.dragBreak) {
      this.dragXCommon.dragBreak.remove();
      this.dragXCommon.dragBreak = null;
    }
    if (this.dragYCommon.dragBreak) {
      this.dragYCommon.dragBreak.remove();
      this.dragYCommon.dragBreak = null;
    }
  }
}
