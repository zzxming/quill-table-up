import { expect, test } from '@playwright/test';
import { extendTest } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/docs/test.html');
  page.locator('.ql-container.ql-snow');
});

extendTest('clean handler should not clean insert text format', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await editorPage.setContents([
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
  await editorPage.setSelection(8, 0);

  await page.locator('#container1 .ql-toolbar .ql-clean').click();
  await editorPage.focus();
  await page.keyboard.type('text');

  const delta = await editorPage.getContents();
  const contents = [
    { insert: '\n' },
    { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
    { insert: '12345', attributes: { bold: true } },
    { insert: 'text' },
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
  ];
  for (const [i, op] of delta.ops.entries()) {
    expect(op).toStrictEqual(contents[i]);
  }
});
