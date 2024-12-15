import { expect, test } from '@playwright/test';
import { createTableBySelect } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/docs/test.html');
  page.locator('.ql-container.ql-snow');
});

test('test TableAlign', async ({ page }) => {
  await createTableBySelect(page, 'container1', 3, 3);
  const centerCell = page.locator('#editor1').getByRole('cell').nth(4);
  await centerCell.click();
  const cellBounding = (await centerCell.boundingBox())!;
  expect(cellBounding).not.toBeNull();
  await page.mouse.move(cellBounding.x, cellBounding.y);
  const colBoundingBox = (await page.locator('#editor1 .table-up-resize-line__col').boundingBox())!;
  expect(colBoundingBox).not.toBeNull();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width / 2, colBoundingBox.y + colBoundingBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width / 2 - 200, colBoundingBox.y + colBoundingBox.height / 2);
  await page.mouse.up();
  await centerCell.click();

  const isVisible = await page.locator('#editor1 .table-up-align.table-up-align--active').isVisible();
  expect(isVisible).toBeTruthy();

  const table = page.locator('#editor1 .ql-editor .ql-table');
  await page.locator('#editor1 .table-up-align .table-up-align__item[data-align="center"]').click();
  await expect(table).toHaveCSS('margin-left', `100px`);
  await expect(table).toHaveCSS('margin-right', `100px`);

  await page.locator('#editor1 .table-up-align .table-up-align__item[data-align="right"]').click();
  await expect(table).toHaveCSS('margin-left', `200px`);
  await expect(table).toHaveCSS('margin-right', '0px');

  await page.locator('#editor1 .table-up-align .table-up-align__item[data-align="left"]').click();
  await expect(table).toHaveCSS('margin-left', '0px');
  await expect(table).toHaveCSS('margin-right', '200px');
});
