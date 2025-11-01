import type { TableCellInnerFormat, TableColFormat, TableMainFormat } from '../../formats';

export const isTableAlignRight = (tableMainBlot: TableMainFormat) => !tableMainBlot.full && tableMainBlot.align === 'right';
export function getColRect(cols: TableColFormat[], columnIndex: number) {
  // fix browser compatibility, get column rect left/x inaccurate
  if (columnIndex < 0 || columnIndex >= cols.length) return null;

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

export function isCellsSpan(isX: boolean, tableBlot: TableMainFormat, cells: TableCellInnerFormat[]) {
  if (isX) {
    // if cells have span all rows
    const cols = tableBlot.getCols();
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
    const rowCount = tableBlot.getRows()?.length || 0;
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
    const rows = tableBlot.getRows();
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
    const colCount = tableBlot.getCols()?.length || 0;
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
