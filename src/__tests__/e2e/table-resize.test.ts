import { expect, test } from '@playwright/test';
import { createTableBySelect } from './utils';

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
  const colBoundingBox = (await page.locator('#editor2 .table-up-resize-box__col-separator').nth(1).boundingBox())!;
  expect(colBoundingBox).not.toBeNull();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width - 4, colBoundingBox.y + 4);
  await page.mouse.down();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width - 4 + 100, colBoundingBox.y + 4);
  await page.mouse.up();
  expect(page.locator('#editor2 .ql-table-wrapper col').nth(1)).toHaveAttribute('width', `${Math.floor(cellBounding.width - 4) + 100}px`);

  // row
  const rowBoundingBox = (await page.locator('#editor2 .table-up-resize-box__row-separator').nth(1).boundingBox())!;
  expect(rowBoundingBox).not.toBeNull();
  await page.mouse.move(rowBoundingBox.x, rowBoundingBox.y + rowBoundingBox.height - 4);
  await page.mouse.down();
  await page.mouse.move(rowBoundingBox.x, rowBoundingBox.y + rowBoundingBox.height - 4 + 100);
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

test('test TableResizeScale', async ({ page }) => {
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
