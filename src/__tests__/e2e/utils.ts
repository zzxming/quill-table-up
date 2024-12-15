import type { Page } from '@playwright/test';

export const createTableBySelect = async (page: Page, container: string, row: number, col: number) => {
  await page.locator(`#${container} .ql-toolbar .ql-table-up.ql-picker`).click();
  await page.locator(`#${container} .ql-toolbar .ql-custom-select .table-up-select-box__item[data-row="${row}"][data-col="${col}"]`).click();
};
