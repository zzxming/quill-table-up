import type { Page } from '@playwright/test';
import { firefox, test } from '@playwright/test';
import { EditorPage } from './editor-page';

export async function createTableBySelect(page: Page, container: string, row: number, col: number) {
  await page.locator(`#${container} .ql-toolbar .ql-table-up.ql-picker`).click();
  await page.locator(`#${container} .ql-toolbar .ql-custom-select .table-up-select-box__item[data-row="${row}"][data-col="${col}"]`).click();
}
export async function setBrowser(browserName: string) {
  if (browserName === 'firefox') {
    const browser = await firefox.launch({
      firefoxUserPrefs: {
        'dom.events.asyncClipboard.readText': true,
        'dom.events.testing.asyncClipboard': true,
      },
    });
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5500/docs/test.html');
    page.locator('.ql-container.ql-snow');
    return page;
  }
  return null;
}
export async function pasteHTML(page: Page, html: string) {
  await page.evaluate(({ html }) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/html', html);
    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData,
    });
    document.dispatchEvent(pasteEvent);
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
