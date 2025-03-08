import type { TableMainFormat } from '../../formats';
import Quill from 'quill';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TableCellInnerFormat } from '../../formats';
import { TableUp } from '../../table-up';
import { createTable, createTableBodyHTML, createTableHTML, createTaleColHTML, datasetAlign, datasetFull } from './utils';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('table undo', () => {
  it('merge all cell undo', async () => {
    const quill = await createTable(3, 3);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells(tds);
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
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[0], tds[3], tds[6]]);
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
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[2], tds[5], tds[8]]);
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
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[1], tds[2], tds[5], tds[6], tds[9], tds[10], tds[13], tds[14]]);
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
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[2], tds[5], tds[8]]);
    await vi.runAllTimersAsync();
    tableModule.splitCell([tds[2]]);
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
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[1], tds[2], tds[5], tds[6], tds[9], tds[10], tds[13], tds[14]]);
    await vi.runAllTimersAsync();
    tableModule.splitCell([tds[1]]);
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
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[0], tds[1], tds[2]]);
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
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[0], tds[1], tds[2], tds[3], tds[4], tds[5], tds[6], tds[7], tds[8], tds[9], tds[10], tds[11]]);
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
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[4], tds[5], tds[6], tds[7], tds[8], tds[9], tds[10], tds[11]]);
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
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[6], tds[7], tds[8], tds[11], tds[12], tds[13], tds[16], tds[17], tds[18]]);
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
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[0], tds[1], tds[2], tds[4], tds[5], tds[6], tds[8], tds[9], tds[10]]);
    await vi.runAllTimersAsync();
    tableModule.splitCell([tds[0]]);
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
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[12], tds[13], tds[14], tds[17], tds[18], tds[19], tds[22], tds[23], tds[24]]);
    await vi.runAllTimersAsync();
    tableModule.splitCell([tds[12]]);
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
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[0], tds[1], tds[2], tds[3], tds[5], tds[6], tds[7], tds[8], tds[10], tds[11], tds[12], tds[13], tds[15], tds[16], tds[17], tds[18]]);
    await vi.runAllTimersAsync();
    tableModule.splitCell([tds[0]]);
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
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.appendRow([tds[5]], false);
    await vi.runAllTimersAsync();
    tableModule.appendCol([tds[3]], true);
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
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.appendCol([tds[0]], true);
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

describe('undo cell attribute', () => {
  it('undo set bg color', async () => {
    const quill = await createTable(3, 3);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.setCellAttrs([tds[0], tds[1], tds[2]], 'background-color', 'rgb(253, 235, 255)', true);
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(3, 3)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'data-table-id', 'contenteditable'] },
    );
  });

  it('undo set border color', async () => {
    const quill = await createTable(2, 2);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.setCellAttrs([tds[0], tds[1]], 'border-color', 'red', true);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0"${datasetFull(true)} style="margin-right: auto;">
            ${createTaleColHTML(2)}
            <tbody>
              <tr data-row-id="1">
                <td colspan="1" data-col-id="1" data-row-id="1" rowspan="1" style="border-color: red; border-right-color: red;">
                  <div data-col-id="1" data-colspan="1" data-row-id="1" data-rowspan="1" data-style="border-color: red; border-right-color: red;">
                    <p>1</p>
                  </div>
                </td>
                <td colspan="1" data-col-id="2" data-row-id="1" rowspan="1" style="border-color: red;">
                  <div data-col-id="2" data-colspan="1" data-row-id="1" data-rowspan="1" data-style="border-color: red;">
                    <p>2</p>
                  </div>
                </td>
              </tr>
              <tr data-row-id="2">
                <td colspan="1" data-col-id="1" data-row-id="2" rowspan="1">
                  <div data-col-id="1" data-colspan="1" data-row-id="2" data-rowspan="1">
                    <p>3</p>
                  </div>
                </td>
                <td colspan="1" data-col-id="2" data-row-id="2" rowspan="1">
                  <div data-col-id="2" data-colspan="1" data-row-id="2" data-rowspan="1">
                    <p>4</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'data-table-id', 'contenteditable'] },
    );
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(2, 2)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'data-table-id', 'contenteditable'] },
    );
  });

  it('undo and redo table width change', async () => {
    const quill = await createTable(3, 3, { full: false, width: 100 });
    const table = quill.root.querySelector('table')!;
    const tableBlot = Quill.find(table) as TableMainFormat;
    const cols = tableBlot.getCols();
    for (const col of cols) {
      col.width = 120;
    }
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(3, 3, { full: false, width: 120 })}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'contenteditable'] },
    );

    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(3, 3, { full: false, width: 100 })}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'contenteditable'] },
    );

    quill.history.redo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(3, 3, { full: false, width: 120 })}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'contenteditable'] },
    );
  });

  it('undo table align change', async () => {
    const quill = await createTable(3, 3, { full: false, width: 100 });
    const table = quill.root.querySelector('table')!;
    const tableBlot = Quill.find(table) as TableMainFormat;
    const cols = tableBlot.getCols();
    for (const col of cols) {
      col.align = 'center';
    }
    await vi.runAllTimersAsync();
    quill.history.undo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" style="margin-right: auto; width: 300px;">
            ${createTaleColHTML(3, { full: false, width: 100 })}
            ${createTableBodyHTML(3, 3)}
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'data-table-id', 'contenteditable'] },
    );

    quill.history.redo();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0"${datasetAlign('center')} style="margin-right: auto; width: 300px; margin-left: auto;">
            ${createTaleColHTML(3, { align: 'center', full: false, width: 100 })}
            ${createTableBodyHTML(3, 3)}
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'data-table-id', 'contenteditable'] },
    );
  });
});
