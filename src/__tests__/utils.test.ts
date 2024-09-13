import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TableBodyFormat, TableCellFormat, TableCellInnerFormat, TableMainFormat, TableRowFormat, TableWrapperFormat } from '../formats';
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
    expect(tableCellBlot).toBeInstanceOf(TableCellFormat);
    const tableRowBlot = findParentBlot(tds[0], blotName.tableRow);
    expect(tableRowBlot).toBeInstanceOf(TableRowFormat);
    const tableBodyBlot = findParentBlot(tds[0], blotName.tableBody);
    expect(tableBodyBlot).toBeInstanceOf(TableBodyFormat);
    const tableMainBlot = findParentBlot(tds[0], blotName.tableMain);
    expect(tableMainBlot).toBeInstanceOf(TableMainFormat);
    const tableWrapperBlot = findParentBlot(tds[0], blotName.tableWrapper);
    expect(tableWrapperBlot).toBeInstanceOf(TableWrapperFormat);
    expect(() => findParentBlot(tds[0], 'scroll')).toThrowError(`${blotName.tableCellInner} must be a child of scroll`);
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
    expect(tableCellBlot).toBeInstanceOf(TableCellFormat);
    expect(tableRowBlot).toBeInstanceOf(TableRowFormat);
    expect(tableBodyBlot).toBeInstanceOf(TableBodyFormat);
    expect(tableMainBlot).toBeInstanceOf(TableMainFormat);
    expect(tableWrapperBlot).toBeInstanceOf(TableWrapperFormat);
  });
});
