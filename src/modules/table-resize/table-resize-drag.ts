import type { Delta as TypeDelta } from 'quill';
import type { TableCellInnerFormat, TableMainFormat, TableRowFormat } from '../../formats';
import type { TableUp } from '../../table-up';
import type { DragPosition } from '../../utils';
import type { TableSelection } from '../table-selection';
import type { TableResizeCommonHelper } from './table-resize-common';
import Quill from 'quill';
import { getTableMainRect } from '../../formats';
import { AutoScroller, isUndefined, tableUpInternal } from '../../utils';

const Delta = Quill.import('delta');

export class TableAutoScroller extends AutoScroller {
  minusY = 0;
  minusX = 0;

  checkMinY(containerRect: DOMRect) {
    return this.mouseY + this.minusY < containerRect.top + this.scrollThresholdY;
  }

  checkMinX(containerRect: DOMRect) {
    return this.mouseX + this.minusX < containerRect.left + this.scrollThresholdX;
  }
}

export class DragTableHelper {
  isDragX = false;
  startPosition: ({ position: number; size: number; index: number })[] = [];
  selectedIndex = new Set<number>();
  moveToIndex = -1;
  tableModule: TableUp;
  tableBlot: TableMainFormat;
  dragCommon: TableResizeCommonHelper;

  constructor(tableModule: TableUp, tableBlot: TableMainFormat, dragCommon: TableResizeCommonHelper, isDragX: boolean) {
    this.tableModule = tableModule;
    this.tableBlot = tableBlot;
    this.dragCommon = dragCommon;
    this.isDragX = isDragX;
  }

  onStart(positionInfo: DragPosition, e: PointerEvent, callback?: (context: this) => void) {
    const tableSelection = this.tableModule.getModule<TableSelection>(tableUpInternal.tableSelectionName);
    if (!tableSelection?.boundary || !this.tableBlot) return false;
    const { isSpan, cellIndex } = this.isCellSpan(tableSelection.selectedTds);
    if (!isSpan) return false;
    const { rect: tableRect } = getTableMainRect(this.tableBlot);
    if (!tableRect) return false;
    e.preventDefault();
    this.dragCommon.startValue = this.isDragX ? tableRect.x : tableRect.y;
    this.selectedIndex = cellIndex;

    callback?.(this);
    this.recalculateStartPosition();
  }

  onMove(positionInfo: DragPosition, e: PointerEvent, callback?: (context: this) => void) {
    this.moveToIndex = this.findTheMovedToIndex(e);
    callback?.(this);
  }

  onEnd(positionInfo: DragPosition, e: PointerEvent, callback?: (context: this) => void) {
    callback?.(this);
    this.moveToIndex = -1;
    this.selectedIndex = new Set();
  }

  recalculateStartPosition() {
    if (this.isDragX) {
      this.startPosition = [];
      if (!this.tableBlot) return;
      // calculate column position
      const cols = this.tableBlot.getCols();
      let left = cols[0].domNode.getBoundingClientRect().left;
      for (let index = 0; index < cols.length; index++) {
        const colRect = cols[index].domNode.getBoundingClientRect();
        this.startPosition.push({ size: colRect.width, position: left, index });
        left += colRect.width;
      }
    }
    else {
      this.startPosition = [];
      if (!this.tableBlot) return;
      // calculate row position
      const rows = this.tableBlot.getRows();
      this.startPosition = rows.map((row, index) => {
        const rowRect = row.domNode.getBoundingClientRect();
        return {
          size: rowRect.height,
          position: rowRect.top,
          index,
        };
      });
    }
  }

  findTheMovedToIndex(e: PointerEvent) {
    // find the index moved to
    const offset = this.dragCommon.getOffsetFromStart(this.tableBlot);
    const positionInfo = this.startPosition.find(({ position, size }) => {
      return (this.isDragX ? e.clientX : e.clientY) < position + size / 2 + offset;
    });
    let index = positionInfo?.index;
    if (isUndefined(index) || index < 0) index = this.startPosition.length;
    index = Math.max(0, Math.min(index, this.startPosition.length));
    // if index in selectedIndex, not allow to move
    if (this.selectedIndex.has(index)) return -1;
    return index;
  }

  updateTableStructure(content: TypeDelta, isMoveMinus: boolean) {
    let changeDelta = new Delta();
    if (!this.tableBlot || this.moveToIndex < 0) return changeDelta;
    const tableSelection = this.tableModule.getModule<TableSelection>(tableUpInternal.tableSelectionName);
    if (!tableSelection) return changeDelta;
    if (this.isDragX) {
      const cols = this.tableBlot.getCols();
      const maxColIndex = cols.length - 1;
      const isMoveLast = this.moveToIndex > maxColIndex;
      const selectColId = new Set<string>(tableSelection.selectedTds.map(td => td.colId));
      const moveCols = cols.filter(col => selectColId.has(col.colId));
      const moveColsInfo = moveCols.map((col) => {
        const length = col.length();
        const offset = col.offset(col.scroll);
        const delta = content.slice(offset, offset + length);
        return { offset, delta, length };
      });

      const moveToIndex = Math.min(maxColIndex, this.moveToIndex);
      const baseCol = cols[moveToIndex];
      const colInsertIndex = baseCol.offset(baseCol.scroll) + (isMoveLast ? baseCol.length() : 0);
      const colInsertDelta = moveColsInfo.reduce((delta, cur) => {
        delta = delta.concat(cur.delta);
        return delta;
      }, new Delta().retain(colInsertIndex));
      const colDeletaDelta = moveColsInfo.reduce((delta, cur, index) => {
        const prevColInfo = moveColsInfo[index - 1];
        const offset = prevColInfo ? prevColInfo.offset + prevColInfo.length : 0;
        delta = delta.retain(cur.offset - offset).delete(cur.length);
        return delta;
      }, new Delta());
      const colChangeDelta = isMoveMinus
        ? colDeletaDelta.compose(colInsertDelta)
        : colInsertDelta.compose(colDeletaDelta);

      const tdInfo = tableSelection.selectedTds.map((td) => {
        const length = td.length();
        const offset = td.offset(td.scroll);
        const delta = content.slice(offset, offset + length);
        return { offset, delta, length, rowId: td.rowId };
      });
      const {
        delta: tdDeleteDelta,
        insertDeltaInfo: tdInsertDeltaInfo,
      } = tdInfo.reduce(({ delta, insertDeltaInfo }, cur, index) => {
        const prev = tdInfo[index - 1];
        const offset = prev ? prev.offset + prev.length : 0;
        let prevLength = 0;
        if (index !== 0 && !isMoveMinus) {
          // move to right. delete before insert. retain need count in delete
          // if prev cell not in the same row, retain need add the `insert` delta length
          prevLength = prev.rowId !== cur.rowId ? insertDeltaInfo[prev.rowId]?.length() : 0;
        }
        delta = delta.retain(cur.offset - offset + prevLength).delete(cur.length);

        if (!insertDeltaInfo[cur.rowId]) insertDeltaInfo[cur.rowId] = new Delta();
        insertDeltaInfo[cur.rowId] = insertDeltaInfo[cur.rowId].concat(cur.delta);
        return { delta, insertDeltaInfo };
      }, { delta: new Delta(), insertDeltaInfo: {} } as { delta: TypeDelta; insertDeltaInfo: Record<string, TypeDelta> });

      const rows = this.tableBlot.getRows();
      const { delta: tdInsertDelta } = rows.reduce(({ delta, offset }, row, index) => {
        const info = row.getCellByColumIndex(Math.min(maxColIndex, this.moveToIndex));
        const td = info[0];
        if (!td) return { delta, offset };
        const tdOffset = td.offset(td.scroll) + (isMoveLast ? td.length() : 0);
        let retain = tdOffset - offset;
        if (index !== 0 && isMoveMinus) {
          // move to left. insert before delete. retain need count in insert
          // minus each previous line `insert` delta length
          const prevRow = tdInsertDeltaInfo[rows[index - 1].rowId];
          if (prevRow) {
            retain -= prevRow.length();
          }
        }
        delta.retain(retain);
        if (tdInsertDeltaInfo[td.rowId]) {
          delta = delta.concat(tdInsertDeltaInfo[td.rowId]);
        }
        return { delta, offset: tdOffset };
      }, { delta: new Delta(), offset: 0 });
      const cellChangeDelta = isMoveMinus
        ? tdDeleteDelta.compose(tdInsertDelta)
        : tdInsertDelta.compose(tdDeleteDelta);

      // Delta.compose doesn't calculate retain with `delete` or `insert`, but `updateContent` will
      changeDelta = colChangeDelta.compose(cellChangeDelta);
    }
    else {
      const rows = this.tableBlot.getRows();
      const maxRowIndex = rows.length - 1;
      const isMoveLast = this.moveToIndex > maxRowIndex;
      const moveToIndex = Math.min(maxRowIndex, this.moveToIndex);
      const baseRow = rows[moveToIndex];
      const selectedRows = Array.from(
        tableSelection.selectedTds.reduce(
          (rowSet, td) => rowSet.add(td.getTableRow()!),
          new Set<TableRowFormat>(),
        ),
      ).filter(Boolean);

      let lastOffset = 0;
      const { delta: rowDeleteDelta, start, end } = selectedRows.reduce(({ delta, start, end }, row) => {
        const offset = row.offset(row.scroll);
        const length = row.length();
        delta.retain(offset - lastOffset).delete(length);
        lastOffset = offset + length;
        return {
          delta,
          start: Math.min(start, offset),
          end: Math.max(end, offset + length),
        };
      }, { delta: new Delta(), start: Number.POSITIVE_INFINITY, end: 0 });
      const rowInsertIndex = baseRow.offset(baseRow.scroll) + (isMoveLast ? baseRow.length() : 0);
      const rowInsertDelta = new Delta().retain(rowInsertIndex).concat(content.slice(start, end));
      changeDelta = isMoveMinus
        ? rowDeleteDelta.compose(rowInsertDelta)
        : rowInsertDelta.compose(rowDeleteDelta);
    }
    return changeDelta;
  }

  isCellSpan(cells: TableCellInnerFormat[]) {
    if (this.isDragX) {
      // if cells have span all rows
      const cols = this.tableBlot.getCols();
      const colIds = cols.map(col => col.colId);
      const countColIds = new Set<string>();
      const countRowspan = new Map<string, number>(colIds.map(id => [id, 0]));
      const cellIndex = new Set<number>();
      for (const cell of cells) {
        countColIds.add(cell.colId);
        const colIndex = colIds.indexOf(cell.colId);
        if (colIndex === -1) continue;
        for (let i = colIndex; i < colIndex + cell.colspan && i < colIds.length; i++) {
          cellIndex.add(i);
          const id = colIds[i];
          countRowspan.set(id, (countRowspan.get(id) || 0) + cell.rowspan);
        }
        cellIndex.add(Math.min(colIndex + cell.colspan, colIds.length));
      }
      const rowCount = this.tableBlot.getRows()?.length || 0;
      for (const [id, count] of countRowspan.entries()) {
        if (count >= rowCount) {
          countColIds.delete(id);
        }
      }
      return {
        cellIndex,
        isSpan: countColIds.size <= 0,
      };
    }
    else {
      // if cells have span all columns
      const rows = this.tableBlot.getRows();
      const rowIds = rows.map(row => row.rowId);
      const countRowIds = new Set<string>();
      const countRowspan = new Map<string, number>(rowIds.map(id => [id, 0]));
      const cellIndex = new Set<number>();
      for (const cell of cells) {
        countRowIds.add(cell.rowId);
        const rowIndex = rowIds.indexOf(cell.rowId);
        if (rowIndex === -1) continue;
        for (let i = rowIndex; i < rowIndex + cell.rowspan && i < rowIds.length; i++) {
          cellIndex.add(i);
          const id = rowIds[i];
          countRowspan.set(id, (countRowspan.get(id) || 0) + cell.colspan);
        }
        cellIndex.add(Math.min(rowIndex + cell.rowspan, rowIds.length));
      }
      const colCount = this.tableBlot.getCols()?.length || 0;
      for (const [id, count] of countRowspan.entries()) {
        if (count >= colCount) {
          countRowIds.delete(id);
        }
      }
      return {
        cellIndex,
        isSpan: countRowIds.size <= 0,
      };
    }
  }
}
