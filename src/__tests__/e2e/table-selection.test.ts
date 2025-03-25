import { expect, test } from '@playwright/test';
import { createTableBySelect, extendTest } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/docs/test.html');
  page.locator('.ql-container.ql-snow');
});

test('test TableSelection horizontal', async ({ page }) => {
  await createTableBySelect(page, 'container1', 5, 5);
  const cell = page.locator('#editor1 .ql-editor .ql-table td').nth(0);
  await cell.click();
  const cellBounding = (await cell.boundingBox())!;
  expect(cellBounding).not.toBeNull();

  await cell.click();
  const selectionLine = page.locator('#editor1 .table-up-selection__line');
  await expect(selectionLine).toBeVisible();
  await page.mouse.down();
  await page.mouse.move(cellBounding.x + cellBounding.width * 3, cellBounding.y + cellBounding.height / 2);
  await page.mouse.up();

  await expect(selectionLine).toBeVisible();
  expect(
    Number.parseFloat(await selectionLine.evaluate(el => getComputedStyle(el).width)),
  ).toBeCloseTo(cellBounding.width * 3, -1);
  expect(
    Number.parseFloat(await selectionLine.evaluate(el => getComputedStyle(el).height)),
  ).toBeCloseTo(cellBounding.height, -1);

  await cell.click({ button: 'right' });
  await page.locator('.table-up-menu.is-contextmenu .table-up-menu__item').filter({ hasText: 'Merge Cell' }).first().click();

  await page.locator('#editor1 .ql-editor .ql-table td').nth(3).click();
  await page.locator('#editor1 .ql-editor .ql-table td').nth(3).click();
  await expect(selectionLine).toBeVisible();
  await page.mouse.down();
  await page.mouse.move(cellBounding.x + 10, cellBounding.y + 10);
  await page.mouse.up();

  const mergeCellBounding = (await page.locator('#editor1 .ql-editor .ql-table td').nth(0).boundingBox())!;
  expect(mergeCellBounding).not.toBeNull();
  expect(
    Number.parseFloat(await selectionLine.evaluate(el => getComputedStyle(el).width)),
  ).toBeCloseTo(mergeCellBounding.width, -1);
  expect(
    Number.parseFloat(await selectionLine.evaluate(el => getComputedStyle(el).height)),
  ).toBeCloseTo(mergeCellBounding.height + cellBounding.height, -1);
});

test('test TableSelection vertical', async ({ page }) => {
  await createTableBySelect(page, 'container1', 5, 5);
  const cell = page.locator('#editor1 .ql-editor .ql-table td').nth(0);
  const cellBounding = (await cell.boundingBox())!;
  expect(cellBounding).not.toBeNull();
  await cell.click();
  await cell.click();
  const selectionLine = page.locator('#editor1 .table-up-selection__line');
  await expect(selectionLine).toBeVisible();

  await page.locator('#editor1 .ql-editor .ql-table td').nth(0).click();
  await page.locator('#editor1 .ql-editor .ql-table td').nth(0).click();
  await expect(selectionLine).toBeVisible();
  await page.mouse.down();
  await page.mouse.move(cellBounding.x, cellBounding.y + cellBounding.height * 3);
  await page.mouse.up();
  await cell.click({ button: 'right' });
  await page.locator('.table-up-menu.is-contextmenu .table-up-menu__item').filter({ hasText: 'Merge Cell' }).first().click();

  await page.locator('#editor1 .ql-editor .ql-table td').nth(0).click();
  await page.locator('#editor1 .ql-editor .ql-table td').nth(0).click();
  await expect(selectionLine).toBeVisible();
  await page.mouse.down();
  await page.mouse.move(cellBounding.x + cellBounding.width * 2 - 10, cellBounding.y + 10);
  await page.mouse.up();

  expect(
    Number.parseFloat(await selectionLine.evaluate(el => getComputedStyle(el).width)),
  ).toBeCloseTo(cellBounding.width * 2, -1);
  expect(
    Number.parseFloat(await selectionLine.evaluate(el => getComputedStyle(el).height)),
  ).toBeCloseTo(cellBounding.height * 3, -1);
});

test('test TableSelection set format list', async ({ page }) => {
  await createTableBySelect(page, 'container1', 2, 2);
  const cell = page.locator('#editor1 .ql-editor .ql-table td').nth(0);
  const cellBounding = (await cell.boundingBox())!;
  expect(cellBounding).not.toBeNull();
  await cell.click();
  await page.mouse.down();
  await page.mouse.move(cellBounding.x + cellBounding.width * 2 - 10, cellBounding.y + cellBounding.height * 2 - 10);
  await page.mouse.up();

  const item = page.locator('.ql-toolbar .ql-list[value="bullet"]').nth(0);
  await item.click();

  expect(await page.locator('#editor1 .ql-table-cell-inner ol').count()).toBe(4);
});

test('test TableSelection set indent format', async ({ page }) => {
  await createTableBySelect(page, 'container1', 2, 2);
  const cell = page.locator('#editor1 .ql-editor .ql-table td').nth(0);
  const cellBounding = (await cell.boundingBox())!;
  expect(cellBounding).not.toBeNull();
  await cell.click();
  await page.mouse.down();
  await page.mouse.move(cellBounding.x + cellBounding.width * 2 - 10, cellBounding.y + cellBounding.height * 2 - 10);
  await page.mouse.up();

  const plus = page.locator('.ql-toolbar .ql-indent[value="+1"]').nth(0);
  await plus.click();
  await plus.click();
  expect(await page.locator('#editor1 .ql-table-cell-inner p.ql-indent-2').count()).toBe(4);

  const reduce = page.locator('.ql-toolbar .ql-indent[value="-1"]').nth(0);
  await reduce.click();
  expect(await page.locator('#editor1 .ql-table-cell-inner p.ql-indent-1').count()).toBe(4);
});

test('test TableSelection set multiple format', async ({ page }) => {
  await createTableBySelect(page, 'container1', 2, 2);
  const cell = page.locator('#editor1 .ql-editor .ql-table td').nth(0);
  const cellBounding = (await cell.boundingBox())!;
  expect(cellBounding).not.toBeNull();
  await cell.click();
  await page.mouse.down();
  await page.mouse.move(cellBounding.x + cellBounding.width * 2 - 10, cellBounding.y + cellBounding.height * 2 - 10);
  await page.mouse.up();

  await page.locator('#editor1 .ql-editor p').nth(0).type('1');
  const cells = page.locator('#editor1 .ql-editor .ql-table-cell-inner');
  await cells.all().then(async (elements) => {
    for (const element of elements) {
      await element.type('1');
    }
  });

  await page.locator('.ql-toolbar .ql-bold').nth(0).click();
  await page.locator('.ql-toolbar .ql-italic').nth(0).click();
  await page.locator('.ql-toolbar .ql-underline').nth(0).click();
  await page.locator('.ql-toolbar .ql-strike').nth(0).click();
  await page.locator('.ql-toolbar .ql-background.ql-picker').nth(0).click();
  await page.locator('.ql-toolbar .ql-background.ql-picker .ql-picker-item[data-value="#e60000"]').nth(0).click();

  const strongEl = page.locator('#editor1 .ql-table-cell-inner strong');
  expect(await strongEl.count()).toBe(4);
  expect(await page.locator('#editor1 .ql-table-cell-inner em').count()).toBe(4);
  expect(await page.locator('#editor1 .ql-table-cell-inner s').count()).toBe(4);
  expect(await page.locator('#editor1 .ql-table-cell-inner u').count()).toBe(4);

  await strongEl.all().then(async (elements) => {
    for (const element of elements) {
      await expect(element).toHaveCSS('background-color', 'rgb(230, 0, 0)');
    }
  });
});

extendTest('test TableSelection should update when text change', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await createTableBySelect(page, 'container1', 3, 3);

  const lineBound = (await page.locator('#editor1 .ql-editor > p').first().boundingBox())!;
  expect(lineBound).not.toBeNull();

  await page.locator('#editor1 .ql-table .ql-table-cell').nth(0).click();
  const selectionWrapper = page.locator('#container1 .table-up-selection');
  await expect(selectionWrapper).toBeVisible();
  const selectionBound = (await selectionWrapper.boundingBox())!;
  expect(selectionBound).not.toBeNull();

  await editorPage.updateContents([{ insert: '12345\n12345' }], 'user');

  await expect(selectionWrapper).toBeVisible();
  const newSelectionWrapper = (await selectionWrapper.boundingBox())!;
  expect(newSelectionWrapper).not.toBeNull();
  expect(newSelectionWrapper.y - selectionBound.y).toBeCloseTo(lineBound.height, 5);
});

extendTest('test TableSelection should update when table resize', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await createTableBySelect(page, 'container1', 3, 3);

  await page.locator('#editor1 .ql-table .ql-table-cell').nth(0).click();
  const selection = page.locator('#container1 .table-up-selection .table-up-selection__line');
  await expect(selection).toBeVisible();
  const selectionBound = (await selection.boundingBox())!;
  expect(selectionBound).not.toBeNull();

  await page.locator('#editor1').getByRole('cell').nth(4).click();
  const colBoundingBox = (await page.locator('#editor1 .table-up-resize-line__col').boundingBox())!;
  expect(colBoundingBox).not.toBeNull();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width / 2, colBoundingBox.y + colBoundingBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width / 2 + 100, colBoundingBox.y + colBoundingBox.height / 2);
  await page.mouse.up();

  await expect(selection).toBeVisible();
  const newSelectionBound = (await selection.boundingBox())!;
  expect(newSelectionBound).not.toBeNull();
  expect(newSelectionBound.width).toBeCloseTo(selectionBound.width + 100, 5);
});

extendTest('test TableSelection should update when selection change', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await createTableBySelect(page, 'container1', 3, 3);

  await page.locator('#editor1 .ql-table .ql-table-cell').nth(0).click();
  const selectionLine = page.locator('#container1 .table-up-selection .table-up-selection__line');
  await expect(selectionLine).toBeVisible();

  await page.keyboard.press('ArrowRight');
  await expect(selectionLine).toBeVisible();
  const newSelectionWrapper = (await selectionLine.boundingBox())!;
  expect(newSelectionWrapper).not.toBeNull();
  const cell1Bound = (await page.locator('#editor1 .ql-editor td').nth(1).boundingBox())!;
  expect(cell1Bound).not.toBeNull();
  expect(cell1Bound).toEqual(newSelectionWrapper);
});

extendTest('test TableSelection and TableMenuSelect should hide when selection out table', async ({ page }) => {
  await createTableBySelect(page, 'container1', 3, 3);
  const firstCell1 = page.locator('#editor1').getByRole('cell').nth(0);
  await firstCell1.click();
  expect(page.locator('#container1 .table-up-selection')).toBeVisible();

  await page.keyboard.down('ArrowUp');
  expect(page.locator('#container1 .table-up-selection')).not.toBeVisible();

  await firstCell1.click();
  await firstCell1.click({ button: 'right' });
  await expect(page.locator('#container1 .table-up-selection')).toBeVisible();
  await expect(page.locator('.table-up-menu.is-contextmenu')).toBeVisible();

  await page.keyboard.down('ArrowUp');
  await expect(page.locator('#container1 .table-up-selection')).not.toBeVisible();
  await expect(page.locator('.table-up-menu.is-contextmenu')).not.toBeVisible();

  await createTableBySelect(page, 'container2', 3, 3);
  const firstCell2 = page.locator('#editor2').getByRole('cell').nth(0);
  await firstCell2.click();
  await expect(page.locator('#container2 .table-up-selection')).toBeVisible();

  await page.keyboard.down('ArrowUp');
  await expect(page.locator('#container2 .table-up-selection')).not.toBeVisible();

  await firstCell2.click();
  await expect(page.locator('#container2 .table-up-selection')).toBeVisible();
  await expect(page.locator('#container2 .table-up-menu')).toBeVisible();

  await page.keyboard.down('ArrowUp');
  await expect(page.locator('#container2 .table-up-selection')).not.toBeVisible();
  await expect(page.locator('#container2 .table-up-menu')).not.toBeVisible();
});

extendTest('test table keyboard ArrowUp and ArrowDown should work', async ({ page, editorPage }) => {
  editorPage.index = 0;
  editorPage.setContents([
    { insert: '123456\n' },
    { insert: { 'table-up-col': { tableId: 'njo6syk0zqb', colId: 'mnpytyt1cno', full: false, width: 291 } } },
    { insert: { 'table-up-col': { tableId: 'njo6syk0zqb', colId: '6ihx044tflt', full: false, width: 291 } } },
    { insert: { 'table-up-col': { tableId: 'njo6syk0zqb', colId: 'raiomwr9yuc', full: false, width: 291 } } },
    { insert: { 'table-up-col': { tableId: 'njo6syk0zqb', colId: 'qiuz7k09q6r', full: false, width: 291 } } },
    { insert: '123' },
    { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'rvwpsb2pky', colId: 'mnpytyt1cno', rowspan: 2, colspan: 2 } }, insert: '\n' },
    { insert: '123456' },
    { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'rvwpsb2pky', colId: 'mnpytyt1cno', rowspan: 2, colspan: 2 } }, insert: '\n' },
    { insert: '123' },
    { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'rvwpsb2pky', colId: 'mnpytyt1cno', rowspan: 2, colspan: 2 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'rvwpsb2pky', colId: 'raiomwr9yuc', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'rvwpsb2pky', colId: 'qiuz7k09q6r', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '123' },
    { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'vhg5x933cs', colId: 'raiomwr9yuc', rowspan: 1, colspan: 2 } }, insert: '\n' },
    { insert: '123456' },
    { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'vhg5x933cs', colId: 'raiomwr9yuc', rowspan: 1, colspan: 2 } }, insert: '\n' },
    { insert: '123' },
    { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'vhg5x933cs', colId: 'raiomwr9yuc', rowspan: 1, colspan: 2 } }, insert: '\n' },
    { insert: '12345' },
    { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'nsb7mrygbk9', colId: 'mnpytyt1cno', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'nsb7mrygbk9', colId: '6ihx044tflt', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'nsb7mrygbk9', colId: 'raiomwr9yuc', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'nsb7mrygbk9', colId: 'qiuz7k09q6r', rowspan: 1, colspan: 1 } }, insert: '\n' },
    { insert: '123456\n' },
  ]);

  await editorPage.setSelection(50, 0);
  await page.keyboard.press('ArrowUp');
  expect((await editorPage.getSelection())!.index).toBe(39);

  await editorPage.setSelection(48, 0);
  await page.keyboard.press('ArrowUp');
  expect((await editorPage.getSelection())!.index).toBe(25);

  await editorPage.setSelection(14, 0);
  await page.keyboard.press('ArrowUp');
  expect((await editorPage.getSelection())!.index).toBe(6);

  await editorPage.setSelection(25, 0);
  await page.keyboard.press('ArrowDown');
  expect((await editorPage.getSelection())!.index).toBe(46);

  await editorPage.setSelection(26, 0);
  await page.keyboard.press('ArrowDown');
  expect((await editorPage.getSelection())!.index).toBe(28);

  await editorPage.setSelection(48, 0);
  await page.keyboard.press('ArrowDown');
  expect((await editorPage.getSelection())!.index).toBe(52);

  await editorPage.setSelection(50, 0);
  await page.keyboard.press('ArrowDown');
  expect((await editorPage.getSelection())!.index).toBe(52);
});

extendTest('test TableSelection should update when selection change and menu display', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await createTableBySelect(page, 'container1', 3, 3);

  await page.locator('#editor1 .ql-table .ql-table-cell').nth(0).click();
  const selectionLine = page.locator('#container1 .table-up-selection .table-up-selection__line');
  await expect(selectionLine).toBeVisible();

  await page.locator('#editor1 .ql-table .ql-table-cell').nth(0).click({ button: 'right' });
  await expect(page.locator('.table-up-menu.is-contextmenu')).toBeVisible();

  await page.locator('.table-up-menu.is-contextmenu .table-up-menu__item').filter({ hasText: 'Set background color' }).first().hover();
  await page.waitForTimeout(1000);
  await expect(selectionLine).not.toBeVisible();

  await page.keyboard.press('ArrowDown');
  await expect(selectionLine).not.toBeVisible();
  await expect(page.locator('.table-up-menu.is-contextmenu')).toBeVisible();

  await page.mouse.move(0, 0);
  await page.waitForTimeout(1000);
  await expect(selectionLine).toBeVisible();

  const selectionWrapper = (await selectionLine.boundingBox())!;
  expect(selectionWrapper).not.toBeNull();
  const cell1Bound = (await page.locator('#editor1 .ql-editor td').nth(3).boundingBox())!;
  expect(cell1Bound).not.toBeNull();
  expect(cell1Bound).toEqual(selectionWrapper);
});
