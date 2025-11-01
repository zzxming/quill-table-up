import { expect, test } from '@playwright/test';
import { extendTest } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/docs/test.html');
  page.locator('.ql-container.ql-snow');
});

extendTest('clipboard convert cell border style with css properties', async ({ page, editorPage }) => {
  editorPage.index = 0;
  await editorPage.html(`<table><tbody><tr><td style="border-color: rgb(var(--color-red));">123</td></tr></tbody></table>`);

  const tdBorderCssText = await page.locator('#container1 .ql-table-wrapper td').nth(0).evaluate(el => el.style.cssText);
  expect(tdBorderCssText).toBe('border-color: rgb(var(--color-red));');

  await editorPage.html(`<table><tbody><tr><td style="background-color: rgb(var(--color-red));">123</td></tr></tbody></table>`);

  const tdBgCssText = await page.locator('#container1 .ql-table-wrapper td').nth(0).evaluate(el => el.style.cssText);
  expect(tdBgCssText).toBe('background-color: rgb(var(--color-red));');
});
