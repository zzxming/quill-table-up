import { expect, test } from '@playwright/test';
import { createTableBySelect, extendTest } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/docs/test.html');
  page.locator('.ql-container.ql-snow');
});

extendTest('test menu color picker should not have two at the same time', async ({ page }) => {
  await createTableBySelect(page, 'container2', 3, 3);
  const centerCell = page.locator('#editor2').getByRole('cell').nth(0);
  await centerCell.click();

  await page.locator('#editor2 .table-up-menu .color-selector').nth(0).hover();
  await page.waitForTimeout(200);

  await page.locator('.table-up-tooltip .custom.table-up-color-map__btn').click();
  const colorpicker = page.locator('.table-up-tooltip .custom.table-up-color-map__btn .table-up-color-picker');
  await expect(colorpicker).toBeVisible();

  await page.locator('#editor2 .table-up-menu .color-selector').nth(1).hover();
  await page.waitForTimeout(200);
  await expect(colorpicker).not.toBeVisible();
  await expect(page.locator('.table-up-tooltip .table-up-color-map')).toBeVisible();
});
