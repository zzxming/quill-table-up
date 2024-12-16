import { expect, test } from '@playwright/test';
import { createTableBySelect } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/docs/test.html');
  page.locator('.ql-container.ql-snow');
});

test('test TableScrollbar', async ({ page }) => {
  await createTableBySelect(page, 'container2', 3, 3);
  const centerCell = page.locator('#editor2').getByRole('cell').nth(4);
  await centerCell.click();
  const cellBounding = (await centerCell.boundingBox())!;
  expect(cellBounding).not.toBeNull();

  expect(await page.locator('#editor2 .table-up-scrollbar.is-vertical').isVisible()).toBeFalsy();
  expect(await page.locator('#editor2 .table-up-scrollbar.is-horizontal').isVisible()).toBeFalsy();

  const colBoundingBox = (await page.locator('#editor2 .table-up-resize-box__col-separator').nth(1).boundingBox())!;
  expect(colBoundingBox).not.toBeNull();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width - 4, colBoundingBox.y + 4);
  await page.mouse.down();
  await page.mouse.move(colBoundingBox.x + colBoundingBox.width - 4 + 100, colBoundingBox.y + 4);
  await page.mouse.up();

  await page.mouse.move(cellBounding.x, cellBounding.y);
  await page.waitForTimeout(200);
  expect(await page.locator('#editor2 .table-up-scrollbar.is-vertical').isVisible()).toBeFalsy();
  expect(await page.locator('#editor2 .table-up-scrollbar.is-horizontal').isVisible()).toBeTruthy();
});
