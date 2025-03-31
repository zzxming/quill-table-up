import { expect, test } from '@playwright/test';
import { createTableBySelect, extendTest } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/docs/test.html');
  page.locator('.ql-container.ql-snow');
});

extendTest('test menu color picker should work correctly', async ({ page }) => {
  await createTableBySelect(page, 'container1', 3, 3);
  const container1Cell = page.locator('#editor1').getByRole('cell').nth(0);
  await container1Cell.click();
  await container1Cell.click({ button: 'right' });

  await page.locator('.table-up-menu.is-contextmenu .table-up-menu__item').filter({ hasText: 'Set background color' }).first().click();
  await page.waitForTimeout(1000);

  await page.locator('.table-up-tooltip .table-up-color-map .table-up-color-map__item[style="background-color: rgb(255, 255, 255);"]').first().click();
  await expect(page.locator('.table-up-menu.is-contextmenu')).toBeVisible();
  await expect(page.locator('#editor1').getByRole('cell').nth(0)).toHaveCSS('background-color', 'rgb(255, 255, 255)');

  await createTableBySelect(page, 'container2', 3, 3);
  const container2Cell = page.locator('#editor2').getByRole('cell').nth(0);
  await container2Cell.click();

  await page.locator('#editor2 .table-up-menu .color-selector').nth(0).click();
  await page.waitForTimeout(1000);

  await page.locator('.table-up-tooltip .table-up-color-map .table-up-color-map__item[style="background-color: rgb(255, 255, 255);"]').first().click();
  await expect(page.locator('#editor2 .table-up-menu')).toBeVisible();
  await expect(page.locator('#editor2').getByRole('cell').nth(0)).toHaveCSS('background-color', 'rgb(255, 255, 255)');
});

extendTest('test menu color picker should not have two at the same time', async ({ page }) => {
  await createTableBySelect(page, 'container2', 3, 3);
  await page.locator('#editor2').getByRole('cell').nth(0).click();

  await page.locator('#editor2 .table-up-menu .color-selector').nth(0).click();
  await page.waitForTimeout(1000);

  await page.locator('.table-up-tooltip .custom.table-up-color-map__btn').click();
  const colorpicker = page.locator('.table-up-tooltip .custom.table-up-color-map__btn .table-up-color-picker');
  await expect(colorpicker).toBeVisible();

  await page.locator('#editor2 .table-up-menu .color-selector').nth(1).click();
  await page.waitForTimeout(1000);
  await expect(colorpicker).not.toBeVisible();
  await expect(page.locator('.table-up-tooltip .table-up-color-map')).toBeVisible();
});

extendTest('test TableMenuSelect should update when text change', async ({ page, editorPage }) => {
  await page.evaluate(() => {
    window.scrollTo(0, 600);
  });

  editorPage.index = 1;
  await createTableBySelect(page, 'container2', 3, 3);

  const lineBound = (await page.locator('#editor2 .ql-editor > p').first().boundingBox())!;
  expect(lineBound).not.toBeNull();

  await page.locator('#editor2 .ql-table .ql-table-cell').nth(0).click();
  const menuWrapper = page.locator('#container2 .table-up-menu');
  await expect(menuWrapper).toBeVisible();
  const menuBound = (await menuWrapper.boundingBox())!;
  expect(menuBound).not.toBeNull();

  await editorPage.updateContents([{ insert: '12345\n12345' }], 'user');
  await page.evaluate(() => {
    window.scrollTo(0, 600);
  });

  await expect(menuWrapper).toBeVisible();
  const newMenuWrapper = (await menuWrapper.boundingBox())!;
  expect(newMenuWrapper).not.toBeNull();

  expect(newMenuWrapper.y - menuBound.y).toBeCloseTo(lineBound.height, 0);
});

extendTest('TableMenu color picker should trigger by click', async ({ page }) => {
  await createTableBySelect(page, 'container1', 3, 3);
  const cell = page.locator('#editor1 .ql-editor .ql-table td').nth(0);
  await cell.click();
  await expect(page.locator('#container1 .table-up-toolbox .table-up-selection .table-up-selection__line')).toBeVisible();
  await cell.click({ button: 'right' });
  const colorItem = page.locator('.table-up-menu.is-contextmenu .table-up-menu__item').filter({ hasText: 'Set background color' }).first();
  await colorItem.hover();
  await expect(page.locator('.table-up-tooltip .table-up-color-map')).not.toBeVisible();
  await colorItem.click();
  await expect(page.locator('.table-up-tooltip .table-up-color-map')).toBeVisible();
});

extendTest('TableMenu color picker display should blur editor', async ({ page }) => {
  await createTableBySelect(page, 'container1', 3, 3);
  const cell = page.locator('#editor1 .ql-editor .ql-table td').nth(0);
  await cell.click();
  await expect(page.locator('#container1 .table-up-toolbox .table-up-selection .table-up-selection__line')).toBeVisible();
  await cell.click({ button: 'right' });

  const qlEditor = await page.locator('#editor1 .ql-editor').elementHandle();
  expect(qlEditor).not.toBeNull();
  const isFocused = await page.evaluate((qlEditor) => {
    const activeElement = document.activeElement;
    return qlEditor.contains(activeElement);
  }, qlEditor!);
  expect(isFocused).toBe(true);

  const colorItem = page.locator('.table-up-menu.is-contextmenu .table-up-menu__item').filter({ hasText: 'Set background color' }).first();
  await colorItem.click();
  await expect(page.locator('.table-up-tooltip .table-up-color-map')).toBeVisible();

  const isFocusedAfterMenuDisplay = await page.evaluate((qlEditor) => {
    const activeElement = document.activeElement;
    return qlEditor.contains(activeElement);
  }, qlEditor!);
  expect(isFocusedAfterMenuDisplay).toBe(false);
});

extendTest('test TableSelection should not display when color pick display', async ({ page }) => {
  await createTableBySelect(page, 'container1', 3, 3);
  const cell = page.locator('#editor1 .ql-editor .ql-table td').nth(0);
  await cell.click();
  await expect(page.locator('#container1 .table-up-toolbox .table-up-selection .table-up-selection__line')).toBeVisible();

  await cell.click({ button: 'right' });
  await page.locator('.table-up-menu.is-contextmenu .table-up-menu__item').filter({ hasText: 'Set background color' }).first().click();
  await page.waitForTimeout(1000);
  await expect(page.locator('#container1 .table-up-toolbox .table-up-selection .table-up-selection__line')).not.toBeVisible();

  await page.locator('#editor1 .ql-editor td').nth(0).click();
  await expect(page.locator('#container1 .table-up-toolbox .table-up-selection .table-up-selection__line')).toBeVisible();

  await cell.click();
  await cell.click({ button: 'right' });
  await page.locator('.table-up-menu.is-contextmenu .table-up-menu__item').filter({ hasText: 'Set background color' }).first().click();
  await page.waitForTimeout(1000);
  await page.locator('.table-up-tooltip .table-up-color-map .table-up-color-map__btn.custom').click();
  await page.waitForTimeout(1000);
  const bgPicker = page.locator('.table-up-tooltip .table-up-color-map .table-up-color-map__btn.custom .table-up-color-picker__background');
  const bounding = (await bgPicker.boundingBox())!;
  expect(bounding).not.toBeNull();
  await page.mouse.click(bounding.x + bounding.width / 2, bounding.y + bounding.height / 2);
  await page.waitForTimeout(1000);
  await expect(page.locator('#container1 .table-up-toolbox .table-up-selection .table-up-selection__line')).not.toBeVisible();
});
