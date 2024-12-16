import { expect, test } from '@playwright/test';
import { createTableBySelect } from './utils';

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

  await page.locator('#editor1 .ql-editor .ql-table').click({ button: 'right' });
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
  await page.locator('#editor1 .ql-editor .ql-table').click({ button: 'right' });
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
