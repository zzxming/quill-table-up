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
  const createTable = async (row: number, col: number) => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const table: any[] = [{ insert: '\n' }];
    for (const [i, _] of new Array(col).fill(0).entries()) {
      table.push({ insert: { 'table-up-col': { tableId: '1', colId: i + 1, full: 'true', width: 1 / col * 100 } } });
    }
    for (let i = 0; i < row; i++) {
      for (let j = 0; j < col; j++) {
        table.push(
          { insert: `${i * row + j + 1}` },
          {
            attributes: { 'table-up-cell-inner': { tableId: '1', rowId: i + 1, colId: j + 1, rowspan: 1, colspan: 1 } },
            insert: '\n',
          },
        );
      }
    }
    table.push({ insert: '\n' });
    quill.setContents(table);
    // set range for undo won't scrollSelectionIntoView
    quill.setSelection({ index: 0, length: 0 });
    await vi.runAllTimersAsync();
    return quill;
  };
  const createTableHTML = (row: number, col: number) => {
    return `
      <div>
        <table cellpadding="0" cellspacing="0" data-full="true">
          <colgroup data-full="true">
            ${new Array(col).fill(0).map((_, i) => `<col width="${1 / col * 100}%" data-col-id="${i + 1}" data-full="true" />`).join('\n')}
          </colgroup>
          <tbody>
            ${
              new Array(row).fill(0).map((_, i) => `
                <tr data-row-id="${i + 1}">
                  ${
                    new Array(col).fill(0).map((_, j) => `<td rowspan="1" colspan="1" data-row-id="${i + 1}" data-col-id="${j + 1}">
                      <div data-rowspan="1" data-colspan="1" data-row-id="${i + 1}" data-col-id="${j + 1}"><p>${i * row + j + 1}</p></div>
                    </td>`).join('\n')
                  }
                </tr>
              `).join('\n')
            }
          </tbody>
        </table>
      </div>
    `;
  };

  it('merge all cell undo', async () => {
    const quill = await createTable(3, 3);
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
    `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });
});
