import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TableCellInnerFormat } from '../../formats';
import { TableUp } from '../../table-up';
import { createQuillWithTableModule, createTable, createTaleColHTML } from './utils';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('merge and split cell', () => {
  it('merge cells', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    tableModule.insertTable(3, 3);
    await vi.runAllTimersAsync();
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[3], tds[4], tds[6], tds[7]]);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            <colgroup data-full="true">
              ${new Array(3).fill(0).map(() => `<col width="${1 / 3 * 100}%" data-full="true" />`).join('\n')}
            </colgroup>
            <tbody>
              <tr>
                ${new Array(3).fill(0).map(() => `<td rowspan="1" colspan="1"><div><p><br></p></div></td>`).join('\n')}
              </tr>
              <tr>
                <td rowspan="2" colspan="2">
                  <div>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                  </div>
                </td>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('merge cells and clear rowspan or colspan', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    tableModule.insertTable(2, 5);
    await vi.runAllTimersAsync();
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[1], tds[2], tds[3], tds[6], tds[7], tds[8]]);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            <colgroup data-full="true">
              <col width="20%" data-full="true" />
              <col width="60%" data-full="true" />
              <col width="20%" data-full="true" />
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
                <td rowspan="2" colspan="1">
                  <div>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                  </div>
                </td>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('merge cells across rowspan and colspan', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    tableModule.insertTable(6, 7);
    await vi.runAllTimersAsync();
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[7], tds[8], tds[9], tds[14], tds[15], tds[16], tds[21], tds[22], tds[23]]);
    await vi.runAllTimersAsync();
    tableModule.mergeCells([tds[25], tds[26], tds[27], tds[32], tds[33], tds[34], tds[39], tds[40], tds[41]]);
    await vi.runAllTimersAsync();
    tableModule.mergeCells([tds[3], tds[4], tds[5], tds[10], tds[11], tds[12], tds[17], tds[18], tds[19]]);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            <colgroup data-full="true">
              ${new Array(4).fill(0).map(() => `<col width="${1 / 7 * 100}%" data-full="true" />`).join('\n')}
              <col width="${2 / 7 * 100}%" data-full="true" />
              <col width="${1 / 7 * 100}%" data-full="true" />
            </colgroup>
            <tbody>
              <tr>
                ${new Array(3).fill(0).map(() => `<td rowspan="1" colspan="1"><div><p><br></p></div></td>`).join('\n')}
                <td rowspan="3" colspan="2">
                  <div>
                    ${new Array(9).fill(0).map(() => `<p><br></p>`).join('\n')}
                  </div>
                </td>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
              </tr>
              <tr>
                <td rowspan="3" colspan="3">
                  <div>
                    ${new Array(9).fill(0).map(() => `<p><br></p>`).join('\n')}
                  </div>
                </td>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
                <td rowspan="3" colspan="2">
                  <div>
                    ${new Array(9).fill(0).map(() => `<p><br></p>`).join('\n')}
                  </div>
                </td>
              </tr>
              ${
                new Array(2).fill(0).map(() => `
                  <tr>
                    ${new Array(4).fill(0).map(() => `<td rowspan="1" colspan="1"><div><p><br></p></div></td>`).join('\n')}
                  </tr>
                `).join('\n')
              }
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('split cell', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    tableModule.insertTable(3, 3);
    await vi.runAllTimersAsync();
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[0], tds[1], tds[3], tds[4]]);
    await vi.runAllTimersAsync();
    tableModule.splitCell([tds[0]]);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            <colgroup data-full="true">
              ${new Array(3).fill(0).map(() => `<col width="${1 / 3 * 100}%" data-full="true" />`).join('\n')}
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1">
                  <div>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                  </div>
                </td>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
              </tr>
              ${
                new Array(2).fill(0).map(() => `
                  <tr>
                    ${new Array(3).fill(0).map(() => `<td rowspan="1" colspan="1"><div><p><br></p></div></td>`).join('\n')}
                  </tr>
                `).join('\n')
              }
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('merge cells should sort correct colId', async () => {
    const quill = await createTable(5, 5);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[6], tds[7], tds[11], tds[12]]);
    await vi.runAllTimersAsync();
    tableModule.mergeCells([tds[5], tds[6], tds[10], tds[15], tds[16], tds[17], tds[20], tds[21], tds[22]]);
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
                  new Array(5).fill(0).map((_, j) => `<td rowspan="1" colspan="1" data-row-id="1" data-col-id="${j + 1}">
                    <div data-rowspan="1" data-colspan="1" data-row-id="1" data-col-id="${j + 1}"><p>${j + 1}</p></div>
                  </td>`).join('\n')
                }
              </tr>
              <tr data-row-id="2">
                <td rowspan="4" colspan="3" data-row-id="2" data-col-id="1">
                  <div data-rowspan="4" data-colspan="3" data-row-id="2" data-col-id="1">
                    <p>6</p>
                    <p>7</p>
                    <p>8</p>
                    <p>12</p>
                    <p>13</p>
                    <p>11</p>
                    <p>16</p>
                    <p>17</p>
                    <p>18</p>
                    <p>21</p>
                    <p>22</p>
                    <p>23</p>
                  </div>
                </td>
                <td rowspan="1" colspan="1" data-row-id="2" data-col-id="4">
                  <div data-rowspan="1" data-colspan="1" data-row-id="2" data-col-id="4"><p>9</p></div>
                </td>
                <td rowspan="1" colspan="1" data-row-id="2" data-col-id="5">
                  <div data-rowspan="1" data-colspan="1" data-row-id="2" data-col-id="5"><p>10</p></div>
                </td>
              </tr>
              <tr data-row-id="3">
                <td rowspan="1" colspan="1" data-row-id="3" data-col-id="4">
                  <div data-rowspan="1" data-colspan="1" data-row-id="3" data-col-id="4"><p>14</p></div>
                </td>
                <td rowspan="1" colspan="1" data-row-id="3" data-col-id="5">
                  <div data-rowspan="1" data-colspan="1" data-row-id="3" data-col-id="5"><p>15</p></div>
                </td>
              </tr>
              <tr data-row-id="4">
                <td rowspan="1" colspan="1" data-row-id="4" data-col-id="4">
                  <div data-rowspan="1" data-colspan="1" data-row-id="4" data-col-id="4"><p>19</p></div>
                </td>
                <td rowspan="1" colspan="1" data-row-id="4" data-col-id="5">
                  <div data-rowspan="1" data-colspan="1" data-row-id="4" data-col-id="5"><p>20</p></div>
                </td>
              </tr>
              <tr data-row-id="5">
                <td rowspan="1" colspan="1" data-row-id="5" data-col-id="4">
                  <div data-rowspan="1" data-colspan="1" data-row-id="5" data-col-id="4"><p>24</p></div>
                </td>
                <td rowspan="1" colspan="1" data-row-id="5" data-col-id="5">
                  <div data-rowspan="1" data-colspan="1" data-row-id="5" data-col-id="5"><p>25</p></div>
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
