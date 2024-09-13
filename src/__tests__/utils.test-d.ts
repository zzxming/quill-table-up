import { afterEach, beforeEach, describe, expectTypeOf, it, vi } from 'vitest';
import type { TableBodyFormat, TableCellFormat, TableMainFormat, TableRowFormat, TableWrapperFormat } from '../formats';
import { TableCellInnerFormat } from '../formats';
import { blotName, findParentBlot, findParentBlots } from '../utils';
import { createTable } from './utils';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('test utils', () => {
  it('test findParentBlot', async () => {
    const quill = await createTable(1, 1);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    const tableCellBlot = findParentBlot(tds[0], blotName.tableCell);
    expectTypeOf(tableCellBlot).toEqualTypeOf<TableCellFormat>();
    const tableRowBlot = findParentBlot(tds[0], blotName.tableRow);
    expectTypeOf(tableRowBlot).toEqualTypeOf<TableRowFormat>();
    const tableBodyBlot = findParentBlot(tds[0], blotName.tableBody);
    expectTypeOf(tableBodyBlot).toEqualTypeOf<TableBodyFormat>();
    const tableMainBlot = findParentBlot(tds[0], blotName.tableMain);
    expectTypeOf(tableMainBlot).toEqualTypeOf<TableMainFormat>();
    const tableWrapperBlot = findParentBlot(tds[0], blotName.tableWrapper);
    expectTypeOf(tableWrapperBlot).toEqualTypeOf<TableWrapperFormat>();
  });

  it('test findParentBlots', async () => {
    const quill = await createTable(1, 1);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    const [tableCellBlot, tableRowBlot, tableBodyBlot, tableMainBlot, tableWrapperBlot] = findParentBlots(
      tds[0],
      [
        blotName.tableCell,
        blotName.tableRow,
        blotName.tableBody,
        blotName.tableMain,
        blotName.tableWrapper,
      ] as const,
    );
    expectTypeOf(tableCellBlot).toEqualTypeOf<TableCellFormat>();
    expectTypeOf(tableRowBlot).toEqualTypeOf<TableRowFormat>();
    expectTypeOf(tableBodyBlot).toEqualTypeOf<TableBodyFormat>();
    expectTypeOf(tableMainBlot).toEqualTypeOf<TableMainFormat>();
    expectTypeOf(tableWrapperBlot).toEqualTypeOf<TableWrapperFormat>();
  });
});
