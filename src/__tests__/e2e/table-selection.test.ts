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
