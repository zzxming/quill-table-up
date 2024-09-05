import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TableCellInnerFormat,
} from '../formats';
import type TableUp from '../index';
import { TableSelection } from '../index';
import { createQuillWithTableModule } from './utils';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('merge and split cell', () => {
  it('merge cells', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule('tableUp') as TableUp;
    tableModule.insertTable(3, 3);
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[3], tds[4], tds[6], tds[7]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              ${new Array(3).fill(0).map(() => `<col width="${1 / 3 * 100}%" data-full="true" contenteditable="false" />`).join('\n')}
            </colgroup>
            <tbody>
              <tr>
                ${new Array(3).fill(0).map(() => `<td rowspan="1" colspan="1"><p><p><br></p></p></td>`).join('\n')}
              </tr>
              <tr>
                <td rowspan="2" colspan="2">
                  <p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                  </p>
                </td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
              </tr>
            </tbody>
          </table>
        </p>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });

  it('merge cells and clear rowspan or colspan', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule('tableUp') as TableUp;
    tableModule.insertTable(2, 5);
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[1], tds[2], tds[3], tds[6], tds[7], tds[8]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              <col width="20%" data-full="true" contenteditable="false" />
              <col width="60%" data-full="true" contenteditable="false" />
              <col width="20%" data-full="true" contenteditable="false" />
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
                <td rowspan="2" colspan="1">
                  <p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                  </p>
                </td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
              </tr>
            </tbody>
          </table>
        </p>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });

  it('merge cells across rowspan and colspan', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule('tableUp') as TableUp;
    tableModule.insertTable(6, 7);
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[7], tds[8], tds[9], tds[14], tds[15], tds[16], tds[21], tds[22], tds[23]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    tableModule.tableSelection.selectedTds = [tds[25], tds[26], tds[27], tds[32], tds[33], tds[34], tds[39], tds[40], tds[41]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    tableModule.tableSelection.selectedTds = [tds[3], tds[4], tds[5], tds[10], tds[11], tds[12], tds[17], tds[18], tds[19]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              ${new Array(4).fill(0).map(() => `<col width="${1 / 7 * 100}%" data-full="true" contenteditable="false" />`).join('\n')}
              <col width="${2 / 7 * 100}%" data-full="true" contenteditable="false" />
              <col width="${1 / 7 * 100}%" data-full="true" contenteditable="false" />
            </colgroup>
            <tbody>
              <tr>
                ${new Array(3).fill(0).map(() => `<td rowspan="1" colspan="1"><p><p><br></p></p></td>`).join('\n')}
                <td rowspan="3" colspan="2">
                  <p>
                    ${new Array(9).fill(0).map(() => `<p><br></p>`).join('\n')}
                  </p>
                </td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
              </tr>
              <tr>
                <td rowspan="3" colspan="3">
                  <p>
                    ${new Array(9).fill(0).map(() => `<p><br></p>`).join('\n')}
                  </p>
                </td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
                <td rowspan="3" colspan="2">
                  <p>
                    ${new Array(9).fill(0).map(() => `<p><br></p>`).join('\n')}
                  </p>
                </td>
              </tr>
              ${
                new Array(2).fill(0).map(() => `
                  <tr>
                    ${new Array(4).fill(0).map(() => `<td rowspan="1" colspan="1"><p><p><br></p></p></td>`).join('\n')}
                  </tr>
                `).join('\n')
              }
            </tbody>
          </table>
        </p>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });

  it('split cell', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule('tableUp') as TableUp;
    tableModule.insertTable(3, 3);
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[0], tds[1], tds[3], tds[4]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    tableModule.tableSelection.selectedTds = [tds[0]];
    tableModule.splitCell();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              ${new Array(3).fill(0).map(() => `<col width="${1 / 3 * 100}%" data-full="true" contenteditable="false" />`).join('\n')}
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1">
                  <p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                  </p>
                </td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
              </tr>
              ${
                new Array(2).fill(0).map(() => `
                  <tr>
                    ${new Array(3).fill(0).map(() => `<td rowspan="1" colspan="1"><p><p><br></p></p></td>`).join('\n')}
                  </tr>
                `).join('\n')
              }
            </tbody>
          </table>
        </p>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });
});

describe('remove column from table', () => {
  it('remove column', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule('tableUp') as TableUp;
    tableModule.insertTable(3, 3);
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[0], tds[1], tds[3], tds[4]];
    tableModule.removeCol();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              <col width="${1 / 3 * 100 * 3}%" data-full="true" contenteditable="false" />
            </colgroup>
            <tbody>
              ${
                new Array(3).fill(0).map(() => `
                  <tr>
                    <td rowspan="1" colspan="1"><p><p><br></p></p></td>
                  </tr>
                `).join('\n')
              }
            </tbody>
          </table>
        </p>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });

  it('remove column. remove colspan start cell and rowspan cell', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule('tableUp') as TableUp;
    tableModule.insertTable(4, 4);
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[4], tds[5], tds[6], tds[8], tds[9], tds[10]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    tableModule.tableSelection.selectedTds = [tds[13], tds[14], tds[15]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    tableModule.tableSelection.selectedTds = [tds[1], tds[2]];
    tableModule.removeCol();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              <col width="25%" data-full="true" contenteditable="false" />
              <col width="75%" data-full="true" contenteditable="false" />
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
              </tr>
              <tr>
                <td rowspan="2" colspan="1">
                  <p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                  </p>
                </td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
                <td rowspan="1" colspan="1">
                  <p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </p>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });
});

describe('remove row from table', () => {
  it('remove row', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule('tableUp') as TableUp;
    tableModule.insertTable(3, 3);
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[0], tds[1], tds[2], tds[3], tds[4], tds[5]];
    tableModule.removeRow();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              ${new Array(3).fill(0).map(() => `<col width="${1 / 3 * 100}%" data-full="true" contenteditable="false" />`).join('\n')}
            </colgroup>
            <tbody>
              <tr>
                ${new Array(3).fill(0).map(() => `<td rowspan="1" colspan="1"><p><p><br></p></p></td>`).join('\n')}
              </tr>
            </tbody>
          </table>
        </p>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });

  it('remove row. remove rowspan cell at start index', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule('tableUp') as TableUp;
    tableModule.insertTable(3, 3);
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[1], tds[2], tds[4], tds[5]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    tableModule.tableSelection.selectedTds = [tds[0]];
    tableModule.removeRow();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              ${new Array(3).fill(0).map(() => `<col width="${1 / 3 * 100}%" data-full="true" contenteditable="false" />`).join('\n')}
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
                <td rowspan="1" colspan="2"><p><p><br></p></p></td>
              </tr>
              <tr>
                ${new Array(3).fill(0).map(() => `<td rowspan="1" colspan="1"><p><p><br></p></p></td>`).join('\n')}
              </tr>
            </tbody>
          </table>
        </p>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });
});

describe('insert column into table', () => {
  it('render insert', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule('tableUp') as TableUp;
    tableModule.insertTable(4, 4);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              ${new Array(4).fill(0).map(() => `<col width="${100 / 4}%" data-full="true" contenteditable="false" />`).join('\n')}
            </colgroup>
            <tbody>
              ${
                new Array(4).fill(0).map(() => `
                  <tr>
                    ${new Array(4).fill(0).map(() => `<td rowspan="1" colspan="1"><p><p><br></p></p></td>`).join('\n')}
                  </tr>
                `).join('\n')
              }
            </tbody>
          </table>
        </p>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });

  it('insert column left', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule('tableUp') as TableUp;
    tableModule.insertTable(2, 2);
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[0]];
    tableModule.appendCol(false);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              <col width="6%" data-full="true" contenteditable="false" />
              <col width="44%" data-full="true" contenteditable="false" />
              <col width="50%" data-full="true" contenteditable="false" />
            </colgroup>
            <tbody>
              ${
                new Array(2).fill(0).map(() => `
                  <tr>
                    ${new Array(3).fill(0).map(() => `<td rowspan="1" colspan="1"><p><p><br></p></p></td>`).join('\n')}
                  </tr>
                `).join('\n')
              }
            </tbody>
          </table>
        </p>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });

  it('insert column left and index is inside colspan cell', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule('tableUp') as TableUp;
    tableModule.insertTable(2, 2);
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[2], tds[3]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    tableModule.tableSelection.selectedTds = [tds[1]];
    tableModule.appendCol(false);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              <col width="44%" data-full="true" contenteditable="false" />
              <col width="6%" data-full="true" contenteditable="false" />
              <col width="50%" data-full="true" contenteditable="false" />
            </colgroup>
            <tbody>
              <tr>
                ${new Array(3).fill(0).map(() => `<td rowspan="1" colspan="1"><p><p><br></p></p></td>`).join('\n')}
              </tr>
              <tr>
                <td rowspan="1" colspan="3">
                  <p>
                    <p><br></p>
                    <p><br></p>
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </p>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });

  it('insert column right', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule('tableUp') as TableUp;
    tableModule.insertTable(2, 2);
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[1]];
    tableModule.appendCol(true);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              <col width="44%" data-full="true" contenteditable="false" />
              <col width="50%" data-full="true" contenteditable="false" />
              <col width="6%" data-full="true" contenteditable="false" />
            </colgroup>
            <tbody>
              ${
                new Array(2).fill(0).map(() => `
                  <tr>
                    ${new Array(3).fill(0).map(() => `<td rowspan="1" colspan="1"><p><p><br></p></p></td>`).join('\n')}
                  </tr>
                `).join('\n')
              }
            </tbody>
          </table>
        </p>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });

  it('insert column right and index is inside colspan cell', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule('tableUp') as TableUp;
    tableModule.insertTable(2, 2);
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[2], tds[3]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    tableModule.tableSelection.selectedTds = [tds[0]];
    tableModule.appendCol(true);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              <col width="44%" data-full="true" contenteditable="false" />
              <col width="6%" data-full="true" contenteditable="false" />
              <col width="50%" data-full="true" contenteditable="false" />
            </colgroup>
            <tbody>
              <tr>
                ${new Array(3).fill(0).map(() => `<td rowspan="1" colspan="1"><p><p><br></p></p></td>`).join('\n')}
              </tr>
              <tr>
                <td rowspan="1" colspan="3">
                  <p>
                    <p><br></p>
                    <p><br></p>
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </p>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });

  it('insert column with colspan cell', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule('tableUp') as TableUp;
    tableModule.insertTable(2, 2);
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[0], tds[1]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    tableModule.tableSelection.selectedTds = [tds[0]];
    tableModule.appendCol(true);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              <col width="44%" data-full="true" contenteditable="false" />
              <col width="50%" data-full="true" contenteditable="false" />
              <col width="6%" data-full="true" contenteditable="false" />
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="2">
                  <p>
                    <p><br></p>
                    <p><br></p>
                  </p>
                </td>
                <td rowspan="1" colspan="1">
                  <p>
                    <p><br></p>
                  </p>
                </td>
              </tr>
              <tr>
                ${new Array(3).fill(0).map(() => `<td rowspan="1" colspan="1"><p><p><br></p></p></td>`).join('\n')}
              </tr>
            </tbody>
          </table>
        </p>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });

  it('insert column with mutiple rowspan', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule('tableUp') as TableUp;
    tableModule.insertTable(6, 3);
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[3], tds[4], tds[5], tds[6], tds[7], tds[8], tds[9], tds[10], tds[11]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    tableModule.tableSelection.selectedTds = [tds[12], tds[13], tds[15], tds[16]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    tableModule.tableSelection.selectedTds = [tds[0]];
    tableModule.appendCol(true);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              <col width="${1 / 3 * 100 - 6}%" data-full="true" contenteditable="false" />
              <col width="6%" data-full="true" contenteditable="false" />
              <col width="${1 / 3 * 100}%" data-full="true" contenteditable="false" />
              <col width="${1 / 3 * 100}%" data-full="true" contenteditable="false" />
            </colgroup>
            <tbody>
              <tr>
                ${new Array(4).fill(0).map(() => `<td rowspan="1" colspan="1"><p><p><br></p></p></td>`).join('\n')}
              </tr>
              <tr>
                <td rowspan="1" colspan="4">
                  <p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                  </p>
                </td>
              </tr>
              <tr>
                <td rowspan="2" colspan="3">
                  <p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                  </p>
                </td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
              </tr>
            </tbody>
          </table>
        </p>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });

  it('insert column. tr.insertCell should find correct index and skip index', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule('tableUp') as TableUp;
    tableModule.insertTable(4, 5);
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[2], tds[3], tds[4], tds[7], tds[8], tds[9], tds[12], tds[13], tds[14]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    tableModule.tableSelection.selectedTds = [tds[1]];
    tableModule.appendCol(true);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              <col width="14%" data-full="true" contenteditable="false" />
              <col width="20%" data-full="true" contenteditable="false" />
              <col width="6%" data-full="true" contenteditable="false" />
              <col width="20%" data-full="true" contenteditable="false" />
              <col width="20%" data-full="true" contenteditable="false" />
              <col width="20%" data-full="true" contenteditable="false" />
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
                <td rowspan="3" colspan="3">
                  <p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                  </p>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
              </tr>
              <tr>
                ${new Array(6).fill(0).map(() => `<td rowspan="1" colspan="1"><p><p><br></p></p></td>`).join('\n')}
              </tr>
            </tbody>
          </table>
        </p>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });
});

describe('insert row into table', () => {
  it('insert row top', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule('tableUp') as TableUp;
    tableModule.insertTable(2, 2);
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[0]];
    tableModule.appendRow(false);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              <col width="50%" data-full="true" contenteditable="false" />
              <col width="50%" data-full="true" contenteditable="false" />
            </colgroup>
            <tbody>
              ${
                new Array(3).fill(0).map(() => `
                  <tr>
                    ${new Array(2).fill(0).map(() => `<td rowspan="1" colspan="1"><p><p><br></p></p></td>`).join('\n')}
                  </tr>
                `).join('\n')
              }
            </tbody>
          </table>
        </p>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });

  it('insert row top and index is inside rowspan cell', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule('tableUp') as TableUp;
    tableModule.insertTable(3, 5);
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[0], tds[1], tds[2], tds[5], tds[6], tds[7]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    tableModule.tableSelection.selectedTds = [tds[9], tds[14]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    tableModule.tableSelection.selectedTds = [tds[8]];
    tableModule.appendRow(false);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              ${new Array(5).fill(0).map(() => `<col width="20%" data-full="true" contenteditable="false" />`).join('\n')}
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="3" colspan="3">
                  <p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                  </p>
                </td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
                <td rowspan="2" colspan="1">
                  <p>
                    <p><br></p>
                    <p><br></p>
                  </p>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
              </tr>
            </tbody>
          </table>
        </p>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });

  it('insert row bottom', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule('tableUp') as TableUp;
    tableModule.insertTable(2, 2);
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[2]];
    tableModule.appendRow(true);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              <col width="50%" data-full="true" contenteditable="false" />
              <col width="50%" data-full="true" contenteditable="false" />
            </colgroup>
            <tbody>
              ${
                new Array(3).fill(0).map(() => `
                  <tr>
                    ${new Array(2).fill(0).map(() => `<td rowspan="1" colspan="1"><p><p><br></p></p></td>`).join('\n')}
                  </tr>
                `).join('\n')
              }
            </tbody>
          </table>
        </p>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });

  it('insert row bottom and index is inside rowspan cell', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule('tableUp') as TableUp;
    tableModule.insertTable(2, 5);
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[1], tds[2], tds[3], tds[6], tds[7], tds[8]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    tableModule.tableSelection.selectedTds = [tds[0]];
    tableModule.appendRow(true);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              <col width="20%" data-full="true" contenteditable="false" />
              <col width="60%" data-full="true" contenteditable="false" />
              <col width="20%" data-full="true" contenteditable="false" />
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
                <td rowspan="3" colspan="1">
                  <p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                  </p>
                </td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
              </tr>
            </tbody>
          </table>
        </p>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });
});

describe('unusual delete', () => {
  it('delete head to inside', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule('tableUp') as TableUp;
    tableModule.insertTable(5, 5);
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[0], tds[1], tds[2], tds[5], tds[6], tds[7], tds[10], tds[11], tds[12]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    tableModule.tableSelection.selectedTds = [tds[4], tds[9], tds[14], tds[19]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    tableModule.tableSelection.selectedTds = [tds[17], tds[18], tds[22], tds[23]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    quill.deleteText(0, 16);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `<p><br></p>`,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });

  it('delete tail to outside', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule('tableUp') as TableUp;
    tableModule.insertTable(5, 5);
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[0], tds[1], tds[2], tds[5], tds[6], tds[7], tds[10], tds[11], tds[12]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    tableModule.tableSelection.selectedTds = [tds[4], tds[9], tds[14], tds[19]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    tableModule.tableSelection.selectedTds = [tds[17], tds[18], tds[22], tds[23]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    quill.deleteText(27, 42);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              ${new Array(5).fill(`<col width="20%" data-full="true" contenteditable="false" />`).join('\n')}
            </colgroup>
            <tbody>
              <tr>
               <td rowspan="3" colspan="3">
                  <p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                  </p>
                </td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
                <td rowspan="3" colspan="1">
                  <p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                  </p>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
              </tr>
            </tbody>
          </table>
        </p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });

  // it('delete inside', async () => {
  //   const quill = createQuillWithTableModule(`<p><br></p>`);
  //   const tableModule = quill.getModule('tableUp') as TableUp;
  //   tableModule.insertTable(5, 5);
  //   await vi.runAllTimersAsync();
  //   const table = quill.root.querySelector('table')!;
  //   tableModule.tableSelection = new TableSelection(tableModule, table, quill);
  //   const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
  //   tableModule.tableSelection.selectedTds = [tds[0], tds[1], tds[2], tds[5], tds[6], tds[7], tds[10], tds[11], tds[12]];
  //   tableModule.mergeCells();
  //   await vi.runAllTimersAsync();
  //   tableModule.tableSelection.selectedTds = [tds[4], tds[9], tds[14], tds[19]];
  //   tableModule.mergeCells();
  //   await vi.runAllTimersAsync();
  //   tableModule.tableSelection.selectedTds = [tds[17], tds[18], tds[22], tds[23]];
  //   tableModule.mergeCells();
  //   await vi.runAllTimersAsync();
  //   quill.deleteText(16, 25);
  //   await vi.runAllTimersAsync();
  //   expect(quill.root).toEqualHTML(
  //     `
  //       <p><br></p>
  //       <p>
  //         <table cellpadding="0" cellspacing="0" data-full>
  //           <colgroup>
  //             ${new Array(5).fill(`<col width="20%" data-full="true" contenteditable="false" />`).join('\n')}
  //           </colgroup>
  //           <tbody>
  //             <tr>
  //              <td rowspan="1" colspan="5">
  //                 <p>
  //                   <p><br></p>
  //                   <p><br></p>
  //                   <p><br></p>
  //                   <p><br></p>
  //                   <p><br></p>
  //                   <p><br></p>
  //                   <p><br></p>
  //                   <p><br></p>
  //                   <p><br></p>
  //                 </p>
  //               </td>
  //             </tr>
  //           </tbody>
  //         </table>
  //       </p>
  //       <p><br></p>
  //     `,
  //     { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
  //   );
  // });
});
