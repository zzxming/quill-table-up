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

describe('table undo', () => {
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
        ${createTableHTML(3, 3)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('merge single column undo', async () => {
    const quill = await createTable(3, 3);
    const tableModule = quill.getModule('tableUp') as TableUp;
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[0], tds[3], tds[6]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(3, 3)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('merge last column undo', async () => {
    const quill = await createTable(3, 3);
    const tableModule = quill.getModule('tableUp') as TableUp;
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[2], tds[5], tds[8]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
      <p><br></p>
      ${createTableHTML(3, 3)}
      <p><br></p>
    `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('merge middle column undo', async () => {
    const quill = await createTable(4, 4);
    const tableModule = quill.getModule('tableUp') as TableUp;
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[1], tds[2], tds[5], tds[6], tds[9], tds[10], tds[13], tds[14]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
      <p><br></p>
      ${createTableHTML(4, 4)}
      <p><br></p>
    `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('split column undo', async () => {
    const quill = await createTable(3, 3);
    const tableModule = quill.getModule('tableUp') as TableUp;
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[2], tds[5], tds[8]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    tableModule.tableSelection.selectedTds = [tds[2]];
    tableModule.splitCell();
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
              <tr data-row-id="1">
                <td rowspan="1" colspan="1" data-col-id="1" data-row-id="1">
                  <div data-rowspan="1" data-colspan="1" data-row-id="1" data-col-id="1"><p>1</p></div>
                </td>
                <td rowspan="1" colspan="1" data-col-id="2" data-row-id="1">
                  <div data-rowspan="1" data-colspan="1" data-row-id="1" data-col-id="2"><p>2</p></div>
                </td>
                <td rowspan="3" colspan="1" data-col-id="3" data-row-id="1">
                  <div data-rowspan="3" data-colspan="1" data-row-id="1" data-col-id="3">
                    <p>3</p>
                    <p>6</p>
                    <p>9</p>
                  </div>
                </td>
              </tr>
              <tr data-row-id="2">
                <td rowspan="1" colspan="1" data-col-id="1" data-row-id="2">
                  <div data-rowspan="1" data-colspan="1" data-row-id="2" data-col-id="1"><p>4</p></div>
                </td>
                <td rowspan="1" colspan="1" data-col-id="2" data-row-id="2">
                  <div data-rowspan="1" data-colspan="1" data-row-id="2" data-col-id="2"><p>5</p></div>
                </td>
              </tr>
              <tr data-row-id="3">
                <td rowspan="1" colspan="1" data-col-id="1" data-row-id="3">
                  <div data-rowspan="1" data-colspan="1" data-row-id="3" data-col-id="1"><p>7</p></div>
                </td>
                <td rowspan="1" colspan="1" data-col-id="2" data-row-id="3">
                  <div data-rowspan="1" data-colspan="1" data-row-id="3" data-col-id="2"><p>8</p></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('split middle column undo', async () => {
    const quill = await createTable(4, 4);
    const tableModule = quill.getModule('tableUp') as TableUp;
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[1], tds[2], tds[5], tds[6], tds[9], tds[10], tds[13], tds[14]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    tableModule.tableSelection.selectedTds = [tds[1]];
    tableModule.splitCell();
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            <colgroup data-full="true">
              <col width="25%" data-col-id="1" data-full="true" />
              <col width="50%" data-col-id="2" data-full="true" />
              <col width="25%" data-col-id="4" data-full="true" />
            </colgroup>
            <tbody>
              <tr data-row-id="1">
                <td rowspan="1" colspan="1" data-col-id="1" data-row-id="1">
                  <div data-rowspan="1" data-colspan="1" data-row-id="1" data-col-id="1"><p>1</p></div>
                </td>
                <td rowspan="4" colspan="1" data-col-id="2" data-row-id="1">
                  <div data-rowspan="4" data-colspan="1" data-row-id="1" data-col-id="2">
                    <p>2</p>
                    <p>3</p>
                    <p>6</p>
                    <p>7</p>
                    <p>10</p>
                    <p>11</p>
                    <p>14</p>
                    <p>15</p>
                  </div>
                </td>
                <td rowspan="1" colspan="1" data-col-id="4" data-row-id="1">
                  <div data-rowspan="1" data-colspan="1" data-row-id="1" data-col-id="4"><p>4</p></div>
                </td>
              </tr>
              <tr data-row-id="2">
                <td rowspan="1" colspan="1" data-col-id="1" data-row-id="2">
                  <div data-rowspan="1" data-colspan="1" data-row-id="2" data-col-id="1"><p>5</p></div>
                </td>
                <td rowspan="1" colspan="1" data-col-id="4" data-row-id="2">
                  <div data-rowspan="1" data-colspan="1" data-row-id="2" data-col-id="4"><p>8</p></div>
                </td>
              </tr>
              <tr data-row-id="3">
                <td rowspan="1" colspan="1" data-col-id="1" data-row-id="3">
                  <div data-rowspan="1" data-colspan="1" data-row-id="3" data-col-id="1"><p>9</p></div>
                </td>
                <td rowspan="1" colspan="1" data-col-id="4" data-row-id="3">
                  <div data-rowspan="1" data-colspan="1" data-row-id="3" data-col-id="4"><p>12</p></div>
                </td>
              </tr>
              <tr data-row-id="4">
                <td rowspan="1" colspan="1" data-col-id="1" data-row-id="4">
                  <div data-rowspan="1" data-colspan="1" data-row-id="4" data-col-id="1"><p>13</p></div>
                </td>
                <td rowspan="1" colspan="1" data-col-id="4" data-row-id="4">
                  <div data-rowspan="1" data-colspan="1" data-row-id="4" data-col-id="4"><p>16</p></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });
});
