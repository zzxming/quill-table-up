import { expect, test } from '@playwright/test';
import { createTableBySelect, extendTest } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/docs/test.html');
  page.locator('.ql-container.ql-snow');
});

test('test TableResizeLine fixed width', async ({ page }) => {
  await createTableBySelect(page, 'container1', 3, 3);
  const centerCell = page.locator('#editor1').getByRole('cell').nth(4);
  await centerCell.click();
  const cellBounding = (await centerCell.boundingBox())!;
  expect(cellBounding).not.toBeNull();

  // col
  await page.mouse.move(cellBounding.x + 10, cellBounding.y + 10);
  const colBoundingBox = (await page.locator('#editor1 .table-up-resize-line__col').boundingBox())!;
  expect(colBoundingBox).not.toBeNull();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width / 2, colBoundingBox.y + colBoundingBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width / 2 + 100, colBoundingBox.y + colBoundingBox.height / 2);
  await page.mouse.up();
  expect(page.locator('#editor1 .ql-table-wrapper col').nth(1)).toHaveAttribute('width', `${Math.floor(cellBounding.width) + 100}px`);
  await page.mouse.move(cellBounding.x, cellBounding.y);

  // row
  await page.mouse.move(cellBounding.x + 10, cellBounding.y + 10);
  const rowBoundingBox = (await page.locator('#editor1 .table-up-resize-line__row').boundingBox())!;
  expect(rowBoundingBox).not.toBeNull();
  await page.mouse.move(rowBoundingBox.x + rowBoundingBox.width / 2, rowBoundingBox.y + rowBoundingBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(rowBoundingBox.x + rowBoundingBox.width / 2, rowBoundingBox.y + rowBoundingBox.height / 2 + 100);
  await page.mouse.up();
  const cells = await page.locator('#editor1 .ql-table-wrapper tr').nth(1).locator('td').all();
  for (const cell of cells) {
    await expect(cell).toHaveCSS('height', `${Math.floor(cellBounding.height) + 100}px`);
  }
});

test('test TableResizeBox fixed width', async ({ page }) => {
  await createTableBySelect(page, 'container2', 3, 3);
  const centerCell = page.locator('#editor2').getByRole('cell').nth(4);
  await centerCell.click();
  const cellBounding = (await centerCell.boundingBox())!;
  expect(cellBounding).not.toBeNull();

  // col
  const colBoundingBox = await page.locator('#editor2 .table-up-resize-box__col-separator').nth(1).boundingBox();
  expect(colBoundingBox).not.toBeNull();
  if (!colBoundingBox) {
    throw new Error('colBoundingBox is null');
  }
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width - 4, colBoundingBox.y + 4);
  await page.mouse.down();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width - 4 + 100, colBoundingBox.y + 4);
  await page.mouse.up();
  expect(page.locator('#editor2 .ql-table-wrapper col').nth(1)).toHaveAttribute('width', `${Math.floor(cellBounding.width - 4) + 100}px`);

  // row
  const rowBoundingBox = await page.locator('#editor2 .table-up-resize-box__row-separator').nth(1).boundingBox();
  expect(rowBoundingBox).not.toBeNull();
  if (!rowBoundingBox) {
    throw new Error('rowBoundingBox is null');
  }
  await page.mouse.move(rowBoundingBox.x + 4, rowBoundingBox.y + rowBoundingBox.height - 4);
  await page.mouse.down();
  await page.mouse.move(rowBoundingBox.x + 4, rowBoundingBox.y + rowBoundingBox.height - 4 + 100);
  await page.mouse.up();
  const cells = await page.locator('#editor2 .ql-table-wrapper tr').nth(1).locator('td').all();
  expect(cells.length).toEqual(3);
  for (const cell of cells) {
    await expect(cell).toHaveCSS('height', `${Math.floor(cellBounding.height - 4) + 100}px`);
  }
});

test('test TableResizeLine full width', async ({ page }) => {
  await createTableBySelect(page, 'container3', 4, 4);
  const centerCell = page.locator('#editor3').getByRole('cell').nth(1);
  await centerCell.click();
  const cellBounding = (await centerCell.boundingBox())!;
  const tableBounding = (await page.locator('#editor3 .ql-table').boundingBox())!;
  expect(cellBounding).not.toBeNull();
  expect(tableBounding).not.toBeNull();

  await page.mouse.move(cellBounding.x + 10, cellBounding.y + 10);
  const colBoundingBox = (await page.locator('#editor3 .table-up-resize-line__col').boundingBox())!;
  expect(colBoundingBox).not.toBeNull();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width / 2, colBoundingBox.y + colBoundingBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width / 2 + tableBounding.width * 0.05, colBoundingBox.y + colBoundingBox.height / 2);
  await page.mouse.up();
  const cols = page.locator('#editor3 .ql-table-wrapper col');
  await expect(cols.nth(1)).toHaveAttribute('width', '30%');
  await expect(cols.nth(2)).toHaveAttribute('width', '20%');
});

test('test TableResizeBox full width', async ({ page }) => {
  await createTableBySelect(page, 'container4', 4, 4);
  const centerCell = page.locator('#editor4').getByRole('cell').nth(1);
  await centerCell.click();
  const cellBounding = (await centerCell.boundingBox())!;
  const tableBounding = (await page.locator('#editor4 .ql-table').boundingBox())!;
  expect(cellBounding).not.toBeNull();
  expect(tableBounding).not.toBeNull();

  const colBoundingBox = (await page.locator('#editor4 .table-up-resize-box__col-separator').nth(1).boundingBox())!;
  expect(colBoundingBox).not.toBeNull();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width - 4, colBoundingBox.y + 4);
  await page.mouse.down();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width - 4 + tableBounding.width * 0.05, colBoundingBox.y);
  await page.mouse.up();
  const cols = page.locator('#editor4 .ql-table-wrapper col');
  await expect(cols.nth(1)).toHaveAttribute('width', '30%');
  await expect(cols.nth(2)).toHaveAttribute('width', '20%');
});

test('test TableResizeBox position', async ({ page }) => {
  await createTableBySelect(page, 'container2', 3, 3);

  const firstCell = page.locator('#editor2').getByRole('cell').nth(0);
  await firstCell.click();
  const firstCellBounding = (await firstCell.boundingBox())!;
  expect(firstCellBounding).not.toBeNull();
  const toolBounding = (await page.locator('#editor2 .table-up-toolbox .table-up-resize-box').boundingBox())!;
  expect(toolBounding).not.toBeNull();
  expect(firstCellBounding.x).toEqual(toolBounding.x);
  expect(firstCellBounding.y).toEqual(toolBounding.y);
});

test('test TableResizeScale functional', async ({ page }) => {
  await createTableBySelect(page, 'container1', 3, 3);
  const centerCell = page.locator('#editor1').getByRole('cell').nth(4);
  await centerCell.click();
  const cellBounding = (await centerCell.boundingBox())!;
  const scaleBtnBounding = (await page.locator('#editor1 .table-up-scale__block').boundingBox())!;
  expect(cellBounding).not.toBeNull();
  expect(scaleBtnBounding).not.toBeNull();
  await page.mouse.move(scaleBtnBounding.x + scaleBtnBounding.width / 2, scaleBtnBounding.y + scaleBtnBounding.height / 2);
  await page.mouse.down();
  await page.mouse.move(scaleBtnBounding.x + scaleBtnBounding.width / 2 - 90, scaleBtnBounding.y + scaleBtnBounding.height / 2 + 90);
  await page.mouse.up();
  const cols = page.locator('#editor1 .ql-table-wrapper col');
  for (const col of await cols.all()) {
    await expect(col).toHaveAttribute('width', `${Math.floor(cellBounding.width - 30)}px`);
  }

  const cells = page.locator('#editor1 .ql-table-wrapper td');
  for (const cell of await cells.all()) {
    await expect(cell).toHaveCSS('height', `${Math.floor(cellBounding.height + 30)}px`);
  }
});

extendTest('test TableResizeBox and TableResizeScale should update when text change', async ({ page, editorPage }) => {
  editorPage.index = 1;
  await createTableBySelect(page, 'container2', 3, 3);

  const lineBound = (await page.locator('#editor2 .ql-editor > p').first().boundingBox())!;
  expect(lineBound).not.toBeNull();
  await page.locator('#editor2 .ql-table .ql-table-cell').nth(0).click();
  const scale = page.locator('#container2 .table-up-scale');
  const boxTop = await page.locator('#container2 .table-up-resize-box').evaluate((element) => {
    return Number.parseFloat(window.getComputedStyle(element).top);
  });
  const scaleTop = await scale.evaluate((element) => {
    return Number.parseFloat(window.getComputedStyle(element).top);
  });
  await expect(scale).toBeVisible();
  await expect(page.locator('#container2 .table-up-resize-box .table-up-resize-box__corner')).toBeVisible();

  await editorPage.updateContents([{ insert: '12345\n12345\n12345' }], 'user');
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });

  await expect(scale).toBeVisible();
  await expect(page.locator('#container2 .table-up-resize-box .table-up-resize-box__corner')).toBeVisible();
  const newScaleTop = await scale.evaluate((element) => {
    return Number.parseFloat(window.getComputedStyle(element).top);
  });
  expect(newScaleTop).toBeCloseTo(scaleTop + lineBound.height * 2, 4);
  const newBoxTop = await page.locator('#container2 .table-up-resize-box').evaluate((element) => {
    return Number.parseFloat(window.getComputedStyle(element).top);
  });
  expect(newBoxTop).toBeCloseTo(boxTop + lineBound.height * 2, 4);
});

extendTest('test TableResizeScale should hide when table width switch full', async ({ page, editorPage }) => {
  editorPage.index = 1;
  await createTableBySelect(page, 'container1', 3, 3);

  const cell = page.locator('#editor1 .ql-editor .ql-table td').nth(0);
  await cell.click();
  await expect(page.locator('#container1 .table-up-scale')).toBeVisible();

  await cell.click({ button: 'right' });
  await page.locator('.table-up-menu.is-contextmenu .table-up-menu__item').filter({ hasText: 'Switch table width' }).first().click();
  await expect(page.locator('#container1 .table-up-scale')).not.toBeVisible();
});
