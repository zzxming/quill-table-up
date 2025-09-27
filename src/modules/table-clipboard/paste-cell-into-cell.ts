import type { Op, Delta as TypeDelta } from 'quill';
import type { TableUp } from '../../table-up';
import type { TableCellValue } from '../../utils';
import Quill from 'quill';
import { TableCellInnerFormat } from '../../formats';
import { blotName, findParentBlot } from '../../utils';

const Delta = Quill.import('delta');

interface ArgumentsModule {
  quill: Quill;
  talbeModule: TableUp;
}

interface CellUpdate {
  offset: number;
  length: number;
  insertDelta: TypeDelta;
  cell: TableCellInnerFormat;
  rowspan?: number;
  colspan?: number;
  emptyRow?: string[];
}
interface TableCellValueLike {
  rowId: string;
  colId: string;
  colspan: number;
  rowspan: number;
  emptyRow?: string[];
}
interface CellRecord extends TableCellValueLike {
  deltaOps: Op[];
}

export function pasteCells(modules: ArgumentsModule, selectedTds: TableCellInnerFormat[], pasteDelta: Op[]) {
  const { rows: selectedRows, cols: selectedCols } = getTableCellStructure(selectedTds);
  const { rows: pasteRows, cols: pasteCols, cells: pasteCells } = parsePasteDelta(pasteDelta);

  if (selectedRows === pasteRows && selectedCols === pasteCols) {
    // if paste cells have same rows and cols count. then paste with structure
    pasteWithStructure(selectedTds, pasteCells, modules);
  }
  else {
    // else paste with loop
    pasteWithLoop(modules, selectedTds, pasteCells);
  }
}

export function getTableCellStructure(cells: TableCellInnerFormat[]) {
  if (cells.length === 0) return { rows: 0, cols: 0 };

  const cellPositions = getCellPositions(cells);
  const counts = getCountByPosition(cellPositions);
  return counts;
}

export function parsePasteDelta(delta: Op[]) {
  const cellMap = new Map<string, CellRecord>();

  for (const op of delta) {
    const attributes = op.attributes;
    if (!attributes) continue;
    const cellValue = attributes[blotName.tableCellInner] as TableCellValue;
    if (!cellValue) continue;

    const cellKey = `${cellValue.rowId}-${cellValue.colId}`;
    if (!cellMap.has(cellKey)) {
      const value: CellRecord = {
        rowId: cellValue.rowId,
        colId: cellValue.colId,
        rowspan: cellValue.rowspan || 1,
        colspan: cellValue.colspan || 1,
        deltaOps: [],
      };
      if (cellValue.emptyRow && cellValue.emptyRow.length > 0) {
        value.emptyRow = cellValue.emptyRow;
      }
      cellMap.set(cellKey, value);
    }

    const cell = cellMap.get(cellKey)!;
    const { [blotName.tableCellInner]: cellInnerValue, ...attrs } = attributes;
    cell.deltaOps.push({
      insert: op.insert,
      attributes: { ...attrs },
    });
  }

  const cells = Array.from(cellMap.values());
  const cellPositions = getCellPositions(cells);
  const counts = getCountByPosition(cellPositions);

  return {
    ...counts,
    cells,
  };
}

export function getCountByPosition(infos: ReturnType<typeof getCellPositions>) {
  let minRowIndex = Infinity;
  let maxRowIndex = -Infinity;
  let minColIndex = Infinity;
  let maxColIndex = -Infinity;
  for (const info of infos) {
    const { cell, rowIndex, colIndex } = info;

    const colspan = cell.colspan || 1;
    const rowspan = cell.rowspan || 1;
    minRowIndex = Math.min(minRowIndex, rowIndex);
    maxRowIndex = Math.max(maxRowIndex, rowIndex + rowspan - 1);
    minColIndex = Math.min(minColIndex, colIndex);
    maxColIndex = Math.max(maxColIndex, colIndex + colspan - 1);
  }

  return {
    rows: Math.max(maxRowIndex - minRowIndex + 1, 0),
    cols: Math.max(maxColIndex - minColIndex + 1, 0),
  };
}

export function pasteWithStructure(selectedTds: TableCellInnerFormat[], pasteCells: CellRecord[], modules: ArgumentsModule) {
  const targetPositions = getCellPositions(selectedTds);
  const pastePositions = getCellPositions(pasteCells);

  const positionMap = new Map<string, CellRecord>();
  for (const pos of pastePositions) {
    positionMap.set(`${pos.rowIndex}-${pos.colIndex}`, pos.cell);
  }

  const updates: CellUpdate[] = [];
  const processedCells = new Set<TableCellInnerFormat>();
  for (const targetPos of targetPositions) {
    const targetCell = targetPos.cell;

    // skip updated cells
    if (!targetCell.domNode.isConnected || processedCells.has(targetCell)) continue;

    const pasteCell = positionMap.get(`${targetPos.rowIndex}-${targetPos.colIndex}`);
    if (pasteCell) {
      const update = prepareCellUpdate(modules, targetCell, pasteCell.deltaOps, {
        rowspan: pasteCell.rowspan,
        colspan: pasteCell.colspan,
        emptyRow: pasteCell.emptyRow,
      });
      updates.push(update);
      processedCells.add(targetCell);
    }
  }
  applyCellUpdates(modules, updates);
}

export function getCellPositions<T extends TableCellValueLike>(cells: T[]) {
  const positions: { cell: T; rowIndex: number; colIndex: number }[] = [];

  // calculate the cell position(rowIndex, colIndex)
  const rowMap = groupCellByRow(cells);
  let targetRowIndex = -1;
  const rowPositions = new Map<string, number>();
  for (const [rowId, rowCells] of rowMap.entries()) {
    if (!rowPositions.has(rowId)) {
      targetRowIndex += 1;
      rowPositions.set(rowId, targetRowIndex);
    }

    let currentColIndex = 0;
    for (const cell of rowCells) {
      positions.push({
        cell,
        rowIndex: rowPositions.get(rowId)!,
        colIndex: currentColIndex,
      });

      currentColIndex += cell.colspan || 1;
      // record rowId by emptyRow to increase rowIndex
      const emptyRow = cell.emptyRow || [];
      for (const emptyRowId of emptyRow) {
        if (!rowPositions.has(emptyRowId)) {
          targetRowIndex += 1;
          rowPositions.set(emptyRowId, targetRowIndex);
        }
      }
    }
  }

  return positions;
}

export function groupCellByRow<T extends TableCellValueLike>(cells: T[]) {
  const rowMap = new Map<string, T[]>();
  for (const cell of cells) {
    if (!rowMap.has(cell.rowId)) {
      rowMap.set(cell.rowId, []);
    }
    rowMap.get(cell.rowId)!.push(cell);
  }
  return rowMap;
}

export function pasteWithLoop(modules: ArgumentsModule, selectedTds: TableCellInnerFormat[], pasteCells: CellRecord[]) {
  const rowMap = groupCellByRow(pasteCells);
  const pasteRows = Array.from(rowMap.values());

  const targetCols = getTableCellStructure(selectedTds).cols;
  const updates: CellUpdate[] = [];

  // loop cell in row to fill content
  for (let i = 0; i < selectedTds.length; i++) {
    const targetCell = selectedTds[i];
    // find the correct cell delta
    const targetRow = Math.floor(i / targetCols);
    const targetCol = i % targetCols;
    const pasteRowIndex = targetRow % pasteRows.length;
    const pasteRow = pasteRows[pasteRowIndex];
    const pasteColIndex = targetCol % pasteRow.length;
    const pasteCell = pasteRow[pasteColIndex];

    const update = prepareCellUpdate(modules, targetCell, pasteCell.deltaOps);
    updates.push(update);
  }
  applyCellUpdates(modules, updates);
}

export function prepareCellUpdate(
  modules: ArgumentsModule,
  cell: TableCellInnerFormat,
  deltaOps: Op[],
  attrs?: Pick<TableCellValue, 'rowspan' | 'colspan' | 'emptyRow'>,
): CellUpdate {
  const { rowspan = 1, colspan = 1, emptyRow } = attrs || {};
  if (attrs) {
    cell.rowspan = rowspan;
    cell.colspan = colspan;
    if (emptyRow && emptyRow.length > 0) {
      cell.emptyRow = emptyRow;
    }
  }

  const cellValue = cell.formats();
  const insertDelta = new Delta();
  for (const op of deltaOps) {
    insertDelta.insert(op.insert!, { ...op.attributes, ...cellValue });
  }

  const offset = cell.offset(modules.quill.scroll);
  const length = cell.length();

  return {
    offset,
    length,
    insertDelta,
    cell,
    rowspan,
    colspan,
    emptyRow,
  };
}

export function applyCellUpdates(modules: ArgumentsModule, updates: CellUpdate[]) {
  if (updates.length === 0) return;

  // sort updates by offset to ensure proper deletion order
  updates.sort((a, b) => a.offset - b.offset);
  let combinedDelta = new Delta();
  for (let i = 0; i < updates.length; i++) {
    const update = updates[i];

    let retain = update.offset;
    if (i !== 0) {
      // for subsequent updates, adjust offsets based on previous operations
      const prev = updates[i - 1];
      retain = update.offset - prev.offset - prev.length;
    }
    combinedDelta = combinedDelta
      .retain(retain)
      .concat(update.insertDelta)
      .delete(update.length);
  }
  modules.quill.updateContents(combinedDelta, Quill.sources.USER);

  // remove cells covered by colspan/rowspan
  for (const update of updates) {
    removeOverlappingCells(modules, update);
  }
}

export function removeOverlappingCells(modules: ArgumentsModule, updateCell: CellUpdate) {
  const { cell, rowspan = 1, colspan = 1 } = updateCell;
  if (rowspan === 1 && colspan === 1) return;
  const table = findParentBlot(cell, blotName.tableMain);
  if (!table) return;
  const tableRow = cell.getTableRow();
  if (!tableRow) return;

  const allCells = table.descendants(TableCellInnerFormat);
  const tableRows = table.getRows();
  const cellRowIndex = tableRows.indexOf(tableRow);
  const cellColumnIndex = cell.getColumnIndex();

  const cellsToRemove: TableCellInnerFormat[] = [];
  for (const otherCell of allCells) {
    if (otherCell === cell) continue;

    const otherRow = otherCell.getTableRow();
    if (!otherRow) continue;

    const otherRowIndex = tableRows.indexOf(otherRow);
    const otherColumnIndex = otherCell.getColumnIndex();

    // check if the other cell is within the rowspan/colspan range of the current cell
    const isInRowspanRange = otherRowIndex >= cellRowIndex && otherRowIndex < cellRowIndex + rowspan + (cell.emptyRow?.length || 0);
    const isInColspanRange = otherColumnIndex >= cellColumnIndex && otherColumnIndex < cellColumnIndex + colspan;

    if (isInRowspanRange && isInColspanRange) {
      cellsToRemove.push(otherCell);
    }
  }

  // remove cells covered by the current cell(colspan/rowspan)
  const isAutoMerge = modules.talbeModule.options.autoMergeCell;
  for (const cellToRemove of cellsToRemove) {
    if (cellToRemove.domNode.isConnected) {
      const cellRow = cellToRemove.getTableRow();
      cellToRemove.remove();
      if (!isAutoMerge && cellRow && cellRow.length() <= 0) {
        cellRow.remove();
      }
    }
  }
}
