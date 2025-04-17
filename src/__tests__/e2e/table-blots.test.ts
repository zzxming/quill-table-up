import { expect, test } from '@playwright/test';
import { extendTest } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/docs/test.html');
  page.locator('.ql-container.ql-snow');
});

extendTest('test table full width switch redo and undo', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await editorPage.setContents([
    { insert: '\n' },
    { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
    { insert: { 'table-up-col': { tableId: '1', colId: '4', full: false, width: 100 } } },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '\n' },
  ]);
  await page.waitForTimeout(1000);

  const cell = page.locator('#editor1 .ql-editor .ql-table td').nth(0);
  await cell.click();
  await cell.click({ button: 'right' });
  await page.locator('.table-up-menu.is-contextmenu .table-up-menu__item').filter({ hasText: 'Switch table width' }).first().click();
  expect(await page.locator('#editor1 .ql-editor .ql-table[data-full="true"]').count()).toBe(1);
  expect(await page.locator('#editor1 .ql-editor .ql-table colgroup[data-full="true"]').count()).toBe(1);
  expect(await page.locator('#editor1 .ql-editor .ql-table col[data-full="true"]').count()).toBe(4);
  await page.waitForTimeout(1000);

  await page.keyboard.press('Control+z');
  expect(await page.locator('#editor1 .ql-editor .ql-table[data-full="true"]').count()).toBe(0);
  expect(await page.locator('#editor1 .ql-editor .ql-table colgroup[data-full="true"]').count()).toBe(0);
  expect(await page.locator('#editor1 .ql-editor .ql-table col[width="100px"]').count()).toBe(4);
  await page.waitForTimeout(1000);

  await page.keyboard.press('Control+Shift+z');
  expect(await page.locator('#editor1 .ql-editor .ql-table[data-full="true"]').count()).toBe(1);
  expect(await page.locator('#editor1 .ql-editor .ql-table colgroup[data-full="true"]').count()).toBe(1);
  expect(await page.locator('#editor1 .ql-editor .ql-table col[data-full="true"]').count()).toBe(4);
});
