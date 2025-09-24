import type { Page } from '@playwright/test';
import { test } from '@playwright/test';
import { EditorPage } from './editor-page';

export async function createTableBySelect(page: Page, container: string, row: number, col: number) {
  await page.locator(`#${container} .ql-toolbar .ql-table-up.ql-picker`).click();
  await page.locator(`#${container} .ql-toolbar .ql-custom-select .table-up-select-box__item[data-row="${row}"][data-col="${col}"]`).click();
}

export async function pasteHTML(page: Page, html: string) {
  await page.evaluate(async ({ html }) => {
    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
    });
    await navigator.clipboard.write([clipboardItem]);
  }, { html });
  await page.keyboard.press('Control+V');
  await page.waitForTimeout(1000);
}

export const extendTest = test.extend<{
  editorPage: EditorPage;
}>({
  editorPage: ({ page }, use) => {
    use(new EditorPage(page));
  },
});
