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

extendTest('clean handler should not keep table format when have two empty line after block format(like header)', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await editorPage.setContents([
    { insert: '\n' },
    { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
    { insert: 'header' },
    { attributes: { 'header': 1, 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n\n' },
    { insert: '\n' },
  ]);

  await editorPage.setSelection(0, 11);
  await page.locator('#container1 .ql-toolbar .ql-clean').click();
  const delta = await editorPage.getContents();
  const contents = [{ insert: '\nheader\n\n\n\n' }];
  for (const [i, op] of delta.ops.entries()) {
    expect(op).toStrictEqual(contents[i]);
  }
  expect(await editorPage.getSelection()).toEqual({ index: 0, length: 10 });
});

extendTest('toolbar item handler should trigger source USER', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await editorPage.setContents([
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
  ]);

  const textChangePromise = page.evaluate(() => {
    return new Promise<string>((resolve) => {
      window.quills[0].on('text-change', (delta, oldDelta, source) => {
        if (source === 'user') {
          resolve(source);
        }
      });
    });
  });

  await editorPage.setSelection(3, 1);
  await page.locator('#container1 .ql-toolbar .ql-bold').click();
  const result = await textChangePromise;
  expect(result).toBe('user');
});
