import type { TableCaptionFormat } from '../../formats';
import type { ToolOption } from '../../utils';
import Quill from 'quill';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tableMenuTools } from '../../modules';
import { TableUp } from '../../table-up';
import { createQuillWithTableModule, createTable, createTableBodyHTML, createTableCaptionHTML, createTaleColHTML, expectDelta } from './utils';

const Delta = Quill.import('delta');

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('test tableCaption', () => {
  it('insert tableCaption', async () => {
    const quill = await createTable(3, 3, { full: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    tableModule.table = table;
    (tableMenuTools.InsertCaption as ToolOption).handle(tableModule, [], null);
    await vi.runAllTimersAsync();

    expectDelta(
      new Delta([
        { insert: '\nTable Caption' },
        { attributes: { 'table-up-caption': { tableId: '1', side: 'top' } }, insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
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
      ]),
      quill.getContents(),
    );
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0">
            ${createTableCaptionHTML({ text: 'Table Caption' })}
            ${createTaleColHTML(3, { full: false })}
            ${createTableBodyHTML(3, 3)}
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('tableCaption switch position', async () => {
    const quill = await createTable(3, 3, { full: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    await vi.runAllTimersAsync();
    const table = quill.root.querySelector('table')!;
    tableModule.table = table;
    (tableMenuTools.InsertCaption as ToolOption).handle(tableModule, [], null);
    await vi.runAllTimersAsync();

    const tableCaption = Quill.find(table.querySelector('caption')!)! as TableCaptionFormat;
    expect(tableCaption).not.toBeNull();
    tableCaption.side = 'bottom';
    await vi.runAllTimersAsync();

    expectDelta(
      new Delta([
        { insert: '\nTable Caption' },
        { attributes: { 'table-up-caption': { tableId: '1', side: 'bottom' } }, insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
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
      ]),
      quill.getContents(),
    );
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0">
            ${createTableCaptionHTML({ text: 'Table Caption', side: 'bottom' })}
            ${createTaleColHTML(3, { full: false })}
            ${createTableBodyHTML(3, 3)}
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('tableCaption should merge', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents([
      { insert: '\nTable Caption' },
      { attributes: { 'table-up-caption': { tableId: '1', side: 'bottom' } }, insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
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
    await vi.runAllTimersAsync();

    const table = quill.root.querySelector('table')!;
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    tableModule.table = table;
    (tableMenuTools.InsertCaption as ToolOption).handle(tableModule, [], null);
    await vi.runAllTimersAsync();
    expectDelta(
      new Delta([
        { insert: '\nTable CaptionTable Caption' },
        { attributes: { 'table-up-caption': { tableId: '1', side: 'top' } }, insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
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
      ]),
      quill.getContents(),
    );
    expect(quill.root).toEqualHTML(
      `
          <p><br></p>
          <div>
            <table cellpadding="0" cellspacing="0">
              ${createTableCaptionHTML({ text: 'Table CaptionTable Caption', side: 'top' })}
              ${createTaleColHTML(3, { full: false })}
              ${createTableBodyHTML(3, 3)}
            </table>
          </div>
          <p><br></p>
        `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });
});
