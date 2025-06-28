import { expect, test } from '@playwright/test';
import { extendTest } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/docs/test.html');
  page.locator('.ql-container.ql-snow');
});

extendTest.describe('table cell keyboard handler enter', () => {
  extendTest('cursor at the start of BlockEmbed', async ({ page, editorPage }) => {
    editorPage.index = 0;
    await editorPage.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: true, width: 100 } } },
      { insert: { video: 'https://quilljs.com/' } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await page.waitForTimeout(1000);

    await editorPage.setSelection(2, 0);
    await page.keyboard.press('Enter');
    await expect(page.locator('#editor1 .ql-table-wrapper .ql-table-cell-inner iframe').nth(0)).toBeVisible();
    await expect(page.locator('#editor1 .ql-table-wrapper .ql-table-cell-inner p').nth(0)).toBeVisible();
    const delta = await editorPage.getContents();
    const contents = [
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: true, width: 100 } } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: { video: 'https://quilljs.com/' } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ];
    for (const [i, op] of delta.ops.entries()) {
      expect(op).toStrictEqual(contents[i]);
    }
  });

  extendTest('cursor at the end of BlockEmbed', async ({ page, editorPage }) => {
    editorPage.index = 0;
    await editorPage.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: true, width: 100 } } },
      { insert: { video: 'https://quilljs.com/' } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await page.waitForTimeout(1000);

    await editorPage.setSelection(3, 0);
    await page.keyboard.press('Enter');
    await expect(page.locator('#editor1 .ql-table-wrapper .ql-table-cell-inner p').nth(0)).toBeVisible();
    await expect(page.locator('#editor1 .ql-table-wrapper .ql-table-cell-inner iframe').nth(0)).toBeVisible();
    const delta = await editorPage.getContents();
    const contents = [
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: true, width: 100 } } },
      { insert: { video: 'https://quilljs.com/' } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n\n' },
      { insert: '\n' },
    ];
    for (const [i, op] of delta.ops.entries()) {
      expect(op).toStrictEqual(contents[i]);
    }
  });

  extendTest('selection multiple line', async ({ page, editorPage }) => {
    editorPage.index = 0;
    await editorPage.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: true, width: 100 } } },
      { insert: { video: 'https://quilljs.com/' } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '123' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '123' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    ]);
    await page.waitForTimeout(1000);

    await editorPage.setSelection(3, 7);
    await page.keyboard.press('Enter');
    await expect(page.locator('#editor1 .ql-table-wrapper .ql-table-cell-inner p')).toHaveCount(1);
  });
});
