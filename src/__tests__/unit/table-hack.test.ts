import Quill from 'quill';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TableCellInnerFormat, TableMainFormat } from '../../formats';
import { TableSelection } from '../../modules';
import { TableUp } from '../../table-up';
import { createQuillWithTableModule, createTable, createTableBodyHTML, createTableDeltaOps, createTaleColHTML, expectDelta } from './utils';

const Delta = Quill.import('delta');
if (!Range.prototype.getBoundingClientRect) {
  Range.prototype.getBoundingClientRect = function () {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON: () => {},
    };
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('hack html convert', () => {
  it('getSemanticHTML should not get contenteditable table cell', async () => {
    const quill = await createTable(3, 3, { full: false, width: 100, align: 'right' }, { isEmpty: false });
    await vi.runAllTimersAsync();
    const html = quill.getSemanticHTML();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    expect(doc.body).toEqualHTML(
      `
        <p></p>
        <div contenteditable="false">
          <table cellpadding="0" cellspacing="0" style="margin-left: auto; width: 300px;" data-align="right">
            ${createTaleColHTML(3, { full: false, width: 100, align: 'right' })}
            ${createTableBodyHTML(3, 3, { isEmpty: false, editable: false })}
          </table>
        </div>
        <p></p>
      `,
      { ignoreAttrs: ['class', 'data-table-id'] },
    );
  });

  it('getHTMLByCell should not get contenteditable table cell', async () => {
    const quill = await createTable(3, 3, { full: false, width: 100, align: 'right' }, { isEmpty: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    const html = tableModule.getHTMLByCell([tds[0], tds[1], tds[3], tds[4]]);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    expect(doc.body).toEqualHTML(
      `
        <div contenteditable="false">
          <table cellpadding="0" cellspacing="0" style="margin-left: auto; width: 200px;" data-align="right">
            <colgroup contenteditable="false" data-align="right">
              <col width="100px" data-col-id="1" data-align="right" />
              <col width="100px" data-col-id="2" data-align="right" />
            </colgroup>
            <tbody>
              <tr data-row-id="1">
                <td colspan="1" data-col-id="1" data-row-id="1" rowspan="1">
                  <div data-col-id="1" data-colspan="1" data-row-id="1" data-rowspan="1">
                    <p>1</p>
                  </div>
                </td>
                <td colspan="1" data-col-id="2" data-row-id="1" rowspan="1">
                  <div data-col-id="2" data-colspan="1" data-row-id="1" data-rowspan="1">
                    <p>2</p>
                  </div>
                </td>
              </tr>
              <tr data-row-id="2">
                <td colspan="1" data-col-id="1" data-row-id="2" rowspan="1">
                  <div data-col-id="1" data-colspan="1" data-row-id="2" data-rowspan="1">
                    <p>4</p>
                  </div>
                </td>
                <td colspan="1" data-col-id="2" data-row-id="2" rowspan="1">
                  <div data-col-id="2" data-colspan="1" data-row-id="2" data-rowspan="1">
                    <p>5</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `,
      { ignoreAttrs: ['class', 'data-table-id'] },
    );
  });

  it('getHTMLByCell should not get contenteditable table cell with attribute', async () => {
    const quill = await createTable(4, 4, { full: true, width: 100 }, { isEmpty: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    const html = tableModule.getHTMLByCell([tds[0], tds[1], tds[4], tds[5]]);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    expect(doc.body).toEqualHTML(
      `
        <div contenteditable="false">
          <table cellpadding="0" cellspacing="0" style="margin-right: auto;" data-full="true">
            <colgroup contenteditable="false" data-full="true">
              <col width="50%" data-col-id="1" data-full="true" />
              <col width="50%" data-col-id="2" data-full="true" />
            </colgroup>
            <tbody>
              <tr data-row-id="1">
                <td colspan="1" data-col-id="1" data-row-id="1" rowspan="1">
                  <div data-col-id="1" data-colspan="1" data-row-id="1" data-rowspan="1">
                    <p>1</p>
                  </div>
                </td>
                <td colspan="1" data-col-id="2" data-row-id="1" rowspan="1">
                  <div data-col-id="2" data-colspan="1" data-row-id="1" data-rowspan="1">
                    <p>2</p>
                  </div>
                </td>
              </tr>
              <tr data-row-id="2">
                <td colspan="1" data-col-id="1" data-row-id="2" rowspan="1">
                  <div data-col-id="1" data-colspan="1" data-row-id="2" data-rowspan="1">
                    <p>5</p>
                  </div>
                </td>
                <td colspan="1" data-col-id="2" data-row-id="2" rowspan="1">
                  <div data-col-id="2" data-colspan="1" data-row-id="2" data-rowspan="1">
                    <p>6</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `,
      { ignoreAttrs: ['class', 'data-table-id'] },
    );
  });
});

describe('hack format cell', () => {
  it('origin format cell should effect', async () => {
    const quill = createQuillWithTableModule('<p>0123456789</p>');
    quill.setSelection(3, 2, Quill.sources.SILENT);
    quill.format('bold', true);
    expect(quill.root.innerHTML).toBe(
      '<p>012<strong>34</strong>56789</p>',
    );
    expect(quill.getSelection()).toEqual({ index: 3, length: 2 });

    quill.setSelection(4, 2, Quill.sources.SILENT);
    quill.format('underline', true);
    expect(quill.root.innerHTML).toBe(
      '<p>012<strong>3<u>4</u></strong><u>5</u>6789</p>',
    );
    expect(quill.getSelection()).toEqual({ index: 4, length: 2 });
    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '012' },
        { attributes: { bold: true }, insert: '3' },
        { attributes: { underline: true, bold: true }, insert: '4' },
        { attributes: { underline: true }, insert: '5' },
        { insert: '6789\n' },
      ]),
    );
  });

  it('select part of text in cell should text like origin', async () => {
    const quill = await createTable(2, 2, { full: false }, { isEmpty: false });
    quill.updateContents(
      new Delta()
        .retain(4)
        .insert('23456789')
        .insert('\n', { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } })
        .insert('12345')
        .insert('\n', { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } })
        .insert('123456789'),
    );
    expectDelta(
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { insert: '123456789' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '12345' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '123456789' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '2' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '3' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '4' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
      quill.getContents(),
    );

    quill.setSelection(7, 17, Quill.sources.SILENT);
    quill.format('bold', true);
    quill.format('underline', true);
    expect(quill.getSelection()).toEqual({ index: 7, length: 17 });
    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { insert: '1234' },
        { attributes: { underline: true, bold: true }, insert: '56789' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { attributes: { underline: true, bold: true }, insert: '12345' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { attributes: { underline: true, bold: true }, insert: '12345' },
        { insert: '6789' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '2' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '3' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '4' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );

    quill.updateContents(
      new Delta()
        .retain(30)
        .insert('345')
        .insert('\n', { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } })
        .insert('2345')
        .insert('\n', { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } })
        .insert('2345'),
    );
    quill.setSelection(35, 2, Quill.sources.SILENT);
    quill.format('list', 'ordered');
    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { insert: '1234' },
        { attributes: { underline: true, bold: true }, insert: '56789' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { attributes: { underline: true, bold: true }, insert: '12345' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { attributes: { underline: true, bold: true }, insert: '12345' },
        { insert: '6789' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '2345' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '2345' },
        { attributes: { 'list': 'ordered', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '2345' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '3' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '4' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );
  });

  it('select length is 0 and not have selecteds should format like origin', async () => {
    const quill = await createTable(2, 2, { full: false }, { isEmpty: false });
    quill.updateContents(
      new Delta()
        .retain(4)
        .insert('23456789')
        .insert('\n', { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } })
        .insert('12345')
        .insert('\n', { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } })
        .insert('123456789'),
    );
    quill.setSelection(18, 0, Quill.sources.SILENT);
    quill.format('list', 'bullet');
    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { insert: '123456789' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '12345' },
        { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '123456789' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '2' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '3' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '4' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );
    expect(quill.getSelection()).toEqual({ index: 18, length: 0 });
  });

  it('select length is 0 and selectedTds not empty should format all text in cell', async () => {
    const quill = createQuillWithTableModule('<p></p>', { selection: TableSelection });
    quill.setContents(createTableDeltaOps(2, 2, { full: false }, { isEmpty: false }));
    quill.updateContents(
      new Delta()
        .retain(4)
        .insert('23456789')
        .insert('\n', { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } })
        .insert('12345')
        .insert('\n', { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } })
        .insert('123456789'),
    );

    const tableUp = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableUp.tableSelection!.selectedTds = [tds[0], tds[2]];
    quill.setSelection(18, 0, Quill.sources.SILENT);
    quill.format('bold', true);
    // simulate `getBoundingClientRect` will effect selectedTd computed position. need manual set
    tableUp.tableSelection!.selectedTds = [tds[0], tds[2]];
    quill.setSelection(18, 0, Quill.sources.SILENT);
    quill.format('list', 'bullet');
    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { insert: '123456789', attributes: { bold: true } },
        { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '12345', attributes: { bold: true } },
        { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '123456789', attributes: { bold: true } },
        { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '2' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '3', attributes: { bold: true } },
        { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '4' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );
    expect(quill.getSelection()).toBeNull();
  });

  it('selection not in cell but have selectedTds. should format all text in selected cell', async () => {
    const quill = createQuillWithTableModule('<p></p>', { selection: TableSelection });
    quill.setContents([
      { insert: '12345\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);

    const tableUp = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableUp.tableSelection!.selectedTds = [tds[0], tds[1]];
    quill.setSelection(1, 3, Quill.sources.SILENT);
    quill.format('bold', true);
    // simulate `getBoundingClientRect` will effect selectedTd computed position. need manual set
    tableUp.tableSelection!.selectedTds = [tds[0], tds[1]];
    quill.setSelection(1, 3, Quill.sources.SILENT);
    quill.format('list', 'bullet');
    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '12345\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { insert: '1', attributes: { bold: true } },
        { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '2', attributes: { bold: true } },
        { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '3' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '4' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );
    expect(quill.getSelection()).toBeNull();
  });
});

describe('hack toolbar clean handler', () => {
  it('clean handler should not effect when selection not have cell', async () => {
    const quill = createQuillWithTableModule('<p></p>');
    quill.setContents([
      { attributes: { underline: true, strike: true, italic: true, bold: true }, insert: '12345' },
      { attributes: { header: 1 }, insert: '\n' },
    ]);

    quill.setSelection(0, 5);
    quill.theme.modules.toolbar!.handlers!.clean.call(quill.theme.modules.toolbar as any, true);

    expectDelta(
      quill.getContents(),
      new Delta([{ insert: '12345\n' }]),
    );
    expect(quill.getSelection()).toEqual({ index: 0, length: 5 });
  });

  it('clean handler should clean format exclude cell', async () => {
    const quill = createQuillWithTableModule('<p></p>');
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: '12345', attributes: { bold: true } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '22345', attributes: { bold: true } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);

    quill.setSelection(4, 3, Quill.sources.SILENT);
    quill.theme.modules.toolbar!.handlers!.clean.call(quill.theme.modules.toolbar as any, true);

    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { insert: '1', attributes: { bold: true } },
        { insert: '234' },
        { insert: '5', attributes: { bold: true } },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '22345', attributes: { bold: true } },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '3' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '4' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );
    expect(quill.getSelection()).toEqual({ index: 4, length: 3 });
  });

  it('clean handler should not clean if selection length 0', async () => {
    const quill = createQuillWithTableModule('<p></p>');
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: '12345', attributes: { bold: true } },
      { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '12345', attributes: { bold: true } },
      { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '22345', attributes: { bold: true } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    quill.setSelection(8, 0);
    quill.theme.modules.toolbar!.handlers!.clean.call(quill.theme.modules.toolbar as any, true);

    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { insert: '12345', attributes: { bold: true } },
        { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '12345', attributes: { bold: true } },
        { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '22345', attributes: { bold: true } },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '3' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '4' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );
    expect(quill.getSelection()).toEqual({ index: 8, length: 0 });
  });

  it('clean handler should clean all format in selectedTds', async () => {
    const quill = createQuillWithTableModule('<p></p>', { selection: TableSelection });
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: '12345', attributes: { bold: true } },
      { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '12345', attributes: { bold: true } },
      { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '22345', attributes: { bold: true } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '3', attributes: { bold: true } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '4', attributes: { bold: true } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    const tableUp = quill.getModule(TableUp.moduleName) as TableUp;
    const table = quill.scroll.descendants(TableMainFormat, 0)[0];
    tableUp.tableSelection!.table = table.domNode;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableUp.tableSelection!.selectedTds = tds;

    quill.theme.modules.toolbar!.handlers!.clean.call(quill.theme.modules.toolbar as any, true);
    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { insert: '12345' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '12345' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '22345' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '3' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '4' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );
    expect(quill.getSelection()).toBeNull();
  });

  it('selection not in cell but have selectedTds. should clean all text in selected cell', async () => {
    const quill = createQuillWithTableModule('<p></p>', { selection: TableSelection });
    quill.setContents([
      { insert: '12345', attributes: { bold: true } },
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: '1', attributes: { bold: true } },
      { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '3', attributes: { bold: true } },
      { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    const tableUp = quill.getModule(TableUp.moduleName) as TableUp;
    const table = quill.scroll.descendants(TableMainFormat, 0)[0];
    tableUp.tableSelection!.table = table.domNode;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableUp.tableSelection!.selectedTds = tds;
    quill.setSelection(1, 3, Quill.sources.SILENT);

    quill.theme.modules.toolbar!.handlers!.clean.call(quill.theme.modules.toolbar as any, true);
    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '12345', attributes: { bold: true } },
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { insert: '1' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '2' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '3' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '4' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );
    expect(quill.getSelection()).toBeNull();
  });

  it('clean handler should clean block format text in cell', async () => {
    const quill = createQuillWithTableModule('<p></p>');
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: '123', attributes: { bold: true } },
      { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '123', attributes: { bold: true } },
      { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '3', attributes: { bold: true } },
      { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);

    quill.setSelection(4, 5, Quill.sources.SILENT);
    quill.theme.modules.toolbar!.handlers!.clean.call(quill.theme.modules.toolbar as any, true);
    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { insert: '1', attributes: { bold: true } },
        { insert: '23' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '12' },
        { insert: '3', attributes: { bold: true } },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '2' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '3', attributes: { bold: true } },
        { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '4' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );
    expect(quill.getSelection()).toEqual({ index: 4, length: 5 });
  });

  it('clean handler should clean embed correct', async () => {
    const quill = createQuillWithTableModule('<p></p>', { selection: TableSelection });
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: { image: 'https://71f32f3f-ce5e-4222-95b1-a8f7b05ea469.mdnplay.dev/shared-assets/images/examples/grapefruit-slice.jpg' } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);

    quill.setSelection(4, 1, Quill.sources.SILENT);
    quill.theme.modules.toolbar!.handlers!.clean.call(quill.theme.modules.toolbar as any, true);

    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );
    expect(quill.getSelection()).toEqual({ index: 4, length: 0 });

    quill.history.undo();
    await vi.runAllTimersAsync();
    const tableUp = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableUp.tableSelection!.selectedTds = [tds[1]];
    quill.theme.modules.toolbar!.handlers!.clean.call(quill.theme.modules.toolbar as any, true);
    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );
  });

  it('clean handler trigger source should be USER', async () => {
    const quill = createQuillWithTableModule('<p></p>', { selection: TableSelection });
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);

    const textChangeSpy = vi.fn();
    quill.on(Quill.events.TEXT_CHANGE, textChangeSpy);

    quill.setSelection(3, 1, Quill.sources.SILENT);
    quill.theme.modules.toolbar!.handlers!.clean.call(quill.theme.modules.toolbar as any, true);
    expect(textChangeSpy).toHaveBeenCalledWith(expect.anything(), expect.anything(), Quill.sources.USER);
  });
});
