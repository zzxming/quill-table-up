import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type TableUp from '../index';
import { TableCellInnerFormat, TableSelection } from '../index';
import { createQuillWithTableModule } from './utils';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('table redo', () => {
  it('merge undo', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.updateContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: 'true', width: 33.333_333_333_333_33 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: 'true', width: 33.333_333_333_333_33 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: 'true', width: 33.333_333_333_333_33 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    // set range for undo won't scrollSelectionIntoView
    quill.setSelection({ index: 0, length: 0 });
    await vi.runAllTimersAsync();
    const tableModule = quill.getModule('tableUp') as TableUp;
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = tds;
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
      <p><br></p>
      <div>
        <table cellpadding="0" cellspacing="0" data-full="true">
          <colgroup data-full="true">
            ${new Array(3).fill(0).map((_, i) => `<col width="${1 / 3 * 100}%" data-col-id="${i + 1}" data-full="true" />`).join('\n')}
          </colgroup>
          <tbody>
            ${
              new Array(3).fill(0).map((_, i) => `
                <tr data-row-id="${i + 1}">
                  ${
                    new Array(3).fill(0).map((_, j) => `<td rowspan="1" colspan="1" data-row-id="${i + 1}" data-col-id="${j + 1}">
                      <div data-rowspan="1" data-colspan="1" data-row-id="${i + 1}" data-col-id="${j + 1}"><p>${(i * 3) + j + 1}</p></div>
                    </td>`).join('\n')
                  }
                </tr>
              `).join('\n')
            }
          </tbody>
        </table>
      </div>
      <p><br></p>
      <p><br></p>
    `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });
});
