import type { Page } from '@playwright/test';
import { test } from '@playwright/test';
import { EditorPage } from './editor-page';

export async function createTableBySelect(page: Page, container: string, row: number, col: number) {
  await page.locator(`#${container} .ql-toolbar .ql-table-up.ql-picker`).click();
  await page.locator(`#${container} .ql-toolbar .ql-custom-select .table-up-select-box__item[data-row="${row}"][data-col="${col}"]`).click();
}

export async function pasteHTML(page: Page, html: string) {
  await page.evaluate(async ({ html }) => {
    // Create clipboard data
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/html', html);

    // Create and dispatch paste event directly on the active element
    const activeElement = document.activeElement;
    if (activeElement) {
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData,
      });
      activeElement.dispatchEvent(pasteEvent);
    }
    else {
      // Fallback to document dispatch if no active element
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData,
      });
      document.dispatchEvent(pasteEvent);
    }
  }, { html });
  await page.waitForTimeout(1000);
}
export const extendTest = test.extend<{
  editorPage: EditorPage;
}>({
  editorPage: ({ page }, use) => {
    use(new EditorPage(page));
  },
});
