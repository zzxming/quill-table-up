import type TableUp from '../index';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TableCellInnerFormat, TableSelection } from '../index';
import { createTable, createTableHTML, createTaleColHTML } from './utils';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

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

  it('merge single row undo', async () => {
    const quill = await createTable(3, 3);
    const tableModule = quill.getModule('tableUp') as TableUp;
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[0], tds[1], tds[2]];
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

  it('merge multiple row undo', async () => {
    const quill = await createTable(4, 4);
    const tableModule = quill.getModule('tableUp') as TableUp;
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[0], tds[1], tds[2], tds[3], tds[4], tds[5], tds[6], tds[7], tds[8], tds[9], tds[10], tds[11]];
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

  it('merge middle row undo', async () => {
    const quill = await createTable(4, 4);
    const tableModule = quill.getModule('tableUp') as TableUp;
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[4], tds[5], tds[6], tds[7], tds[8], tds[9], tds[10], tds[11]];
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

  it('5x5 merge center 3x3 cells undo', async () => {
    const quill = await createTable(5, 5);
    const tableModule = quill.getModule('tableUp') as TableUp;
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[6], tds[7], tds[8], tds[11], tds[12], tds[13], tds[16], tds[17], tds[18]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(5, 5)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('4x4 undo split 3x3 at start 1', async () => {
    const quill = await createTable(4, 4);
    const tableModule = quill.getModule('tableUp') as TableUp;
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[0], tds[1], tds[2], tds[4], tds[5], tds[6], tds[8], tds[9], tds[10]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    tableModule.tableSelection.selectedTds = [tds[0]];
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
              <col width="25%" data-col-id="2" data-full="true" />
              <col width="25%" data-col-id="3" data-full="true" />
              <col width="25%" data-col-id="4" data-full="true" />
            </colgroup>
            <tbody>
              <tr data-row-id="1">
                <td rowspan="3" colspan="3" data-col-id="1" data-row-id="1">
                  <div data-rowspan="3" data-colspan="3" data-row-id="1" data-col-id="1">
                    <p>1</p>
                    <p>2</p>
                    <p>3</p>
                    <p>5</p>
                    <p>6</p>
                    <p>7</p>
                    <p>9</p>
                    <p>10</p>
                    <p>11</p>
                  </div>
                </td>
                <td rowspan="1" colspan="1" data-col-id="4" data-row-id="1">
                  <div data-rowspan="1" data-colspan="1" data-row-id="1" data-col-id="4"><p>4</p></div>
                </td>
              </tr>
              <tr data-row-id="2">
                <td rowspan="1" colspan="1" data-col-id="4" data-row-id="2">
                  <div data-rowspan="1" data-colspan="1" data-row-id="2" data-col-id="4"><p>8</p></div>
                </td>
              </tr>
              <tr data-row-id="3">
                <td rowspan="1" colspan="1" data-col-id="4" data-row-id="3">
                  <div data-rowspan="1" data-colspan="1" data-row-id="3" data-col-id="4"><p>12</p></div>
                </td>
              </tr>
              <tr data-row-id="4">
                ${
                  [13, 14, 15, 16].map((num, i) => `
                    <td rowspan="1" colspan="1" data-col-id="${i + 1}" data-row-id="4">
                      <div data-rowspan="1" data-colspan="1" data-row-id="4" data-col-id="${i + 1}"><p>${num}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
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

  it('5x5 undo split 3x3 at end 25 and undo merge 3x3 at end 25', async () => {
    const quill = await createTable(5, 5);
    const tableModule = quill.getModule('tableUp') as TableUp;
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[12], tds[13], tds[14], tds[17], tds[18], tds[19], tds[22], tds[23], tds[24]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    tableModule.tableSelection.selectedTds = [tds[12]];
    tableModule.splitCell();
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            ${createTaleColHTML(5)}
            <tbody>
              <tr data-row-id="1">
                ${
                  [1, 2, 3, 4, 5].map((n, i) => `
                    <td rowspan="1" colspan="1" data-col-id="${i + 1}" data-row-id="1">
                      <div data-rowspan="1" data-colspan="1" data-row-id="1" data-col-id="${i + 1}"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
              <tr data-row-id="2">
                ${
                  [6, 7, 8, 9, 10].map((n, i) => `
                    <td rowspan="1" colspan="1" data-col-id="${i + 1}" data-row-id="2">
                      <div data-rowspan="1" data-colspan="1" data-row-id="2" data-col-id="${i + 1}"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
              <tr data-row-id="3">
                <td rowspan="1" colspan="1" data-col-id="1" data-row-id="3">
                  <div data-rowspan="1" data-colspan="1" data-row-id="3" data-col-id="1"><p>11</p></div>
                </td>
                <td rowspan="1" colspan="1" data-col-id="2" data-row-id="3">
                  <div data-rowspan="1" data-colspan="1" data-row-id="3" data-col-id="2"><p>12</p></div>
                </td>
                <td rowspan="3" colspan="3" data-col-id="3" data-row-id="3">
                  <div data-rowspan="3" data-colspan="3" data-row-id="3" data-col-id="3">
                    <p>13</p>
                    <p>14</p>
                    <p>15</p>
                    <p>18</p>
                    <p>19</p>
                    <p>20</p>
                    <p>23</p>
                    <p>24</p>
                    <p>25</p>
                  </div>
                </td>
              </tr>
              <tr data-row-id="4">
                ${
                  [16, 17].map((n, i) => `
                    <td rowspan="1" colspan="1" data-col-id="${i + 1}" data-row-id="4">
                      <div data-rowspan="1" data-colspan="1" data-row-id="4" data-col-id="${i + 1}"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
              <tr data-row-id="5">
                ${
                  [21, 22].map((n, i) => `
                    <td rowspan="1" colspan="1" data-col-id="${i + 1}" data-row-id="5">
                      <div data-rowspan="1" data-colspan="1" data-row-id="5" data-col-id="${i + 1}"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(5, 5)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('5x5 undo split 4x4 at start 1', async () => {
    const quill = await createTable(5, 5);
    const tableModule = quill.getModule('tableUp') as TableUp;
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[0], tds[1], tds[2], tds[3], tds[5], tds[6], tds[7], tds[8], tds[10], tds[11], tds[12], tds[13], tds[15], tds[16], tds[17], tds[18]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    tableModule.tableSelection.selectedTds = [tds[0]];
    tableModule.splitCell();
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            ${createTaleColHTML(5)}
            <tbody>
              <tr data-row-id="1">
                <td rowspan="4" colspan="4" data-col-id="1" data-row-id="1">
                  <div data-rowspan="4" data-colspan="4" data-row-id="1" data-col-id="1">
                    <p>1</p>
                    <p>2</p>
                    <p>3</p>
                    <p>4</p>
                    <p>6</p>
                    <p>7</p>
                    <p>8</p>
                    <p>9</p>
                    <p>11</p>
                    <p>12</p>
                    <p>13</p>
                    <p>14</p>
                    <p>16</p>
                    <p>17</p>
                    <p>18</p>
                    <p>19</p>
                  </div>
                </td>
                <td rowspan="1" colspan="1" data-col-id="5" data-row-id="1">
                  <div data-rowspan="1" data-colspan="1" data-row-id="1" data-col-id="5"><p>5</p></div>
                </td>
              </tr>
              <tr data-row-id="2">
                ${
                  [10].map(n => `
                    <td rowspan="1" colspan="1" data-col-id="5" data-row-id="2">
                      <div data-rowspan="1" data-colspan="1" data-row-id="2" data-col-id="5"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
              <tr data-row-id="3">
                ${
                  [15].map(n => `
                    <td rowspan="1" colspan="1" data-col-id="5" data-row-id="3">
                      <div data-rowspan="1" data-colspan="1" data-row-id="3" data-col-id="5"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
              <tr data-row-id="4">
                ${
                  [20].map(n => `
                    <td rowspan="1" colspan="1" data-col-id="5" data-row-id="4">
                      <div data-rowspan="1" data-colspan="1" data-row-id="4" data-col-id="5"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
              <tr data-row-id="5">
                ${
                  [21, 22, 23, 24, 25].map((n, i) => `
                    <td rowspan="1" colspan="1" data-col-id="${i + 1}" data-row-id="5">
                      <div data-rowspan="1" data-colspan="1" data-row-id="5" data-col-id="${i + 1}"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(5, 5)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('5x5 undo insert column right with before empty row at start 1', async () => {
    const quill = await createTable(5, 5);
    const tableModule = quill.getModule('tableUp') as TableUp;
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[5]];
    tableModule.appendRow(false);
    await vi.runAllTimersAsync();
    tableModule.tableSelection.selectedTds = [tds[3]];
    tableModule.appendCol(true);
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            ${createTaleColHTML(5)}
            <tbody>
              <tr>
                ${
                  [1, 2, 3, 4, 5].map(n => `
                    <td rowspan="1" colspan="1">
                      <div data-rowspan="1" data-colspan="1"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
              <tr>
                ${
                  new Array(5).fill(0).map(() => `
                    <td rowspan="1" colspan="1">
                      <div data-rowspan="1" data-colspan="1"><p><br /></p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
              <tr>
                ${
                  [6, 7, 8, 9, 10].map(n => `
                    <td rowspan="1" colspan="1">
                      <div data-rowspan="1" data-colspan="1"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
              <tr>
                ${
                  [11, 12, 13, 14, 15].map(n => `
                    <td rowspan="1" colspan="1">
                      <div data-rowspan="1" data-colspan="1"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
              <tr>
                ${
                  [16, 17, 18, 19, 20].map(n => `
                    <td rowspan="1" colspan="1">
                      <div data-rowspan="1" data-colspan="1"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
              <tr>
                ${
                  [21, 22, 23, 24, 25].map(n => `
                    <td rowspan="1" colspan="1">
                      <div data-rowspan="1" data-colspan="1"><p>${n}</p></div>
                    </td>
                  `).join('\n')
                }
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'contenteditable'] },
    );
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(5, 5)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('3x3 undo insert column right at start 1. updateContents insert text between col', async () => {
    const quill = await createTable(3, 3);
    const tableModule = quill.getModule('tableUp') as TableUp;
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[0]];
    tableModule.appendCol(true);
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
});
