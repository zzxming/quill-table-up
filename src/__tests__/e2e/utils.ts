import type { Page } from '@playwright/test';
import { test } from '@playwright/test';
import { EditorPage } from './editor-page';

export const createTableBySelect = async (page: Page, container: string, row: number, col: number) => {
  await page.locator(`#${container} .ql-toolbar .ql-table-up.ql-picker`).click();
  await page.locator(`#${container} .ql-toolbar .ql-custom-select .table-up-select-box__item[data-row="${row}"][data-col="${col}"]`).click();
};

export const extendTest = test.extend<{
  editorPage: EditorPage;
}>({
  editorPage: ({ page }, use) => {
    use(new EditorPage(page));
  },
});
