import { expect, test } from '@playwright/test';
import { createTableBySelect, extendTest } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/docs/test.html');
  page.locator('.ql-container.ql-snow');
});

extendTest.describe('table cell keyboard handler enter', () => {
  extendTest('cursor at the start of BlockEmbed', async ({ page, editorPage }) => {
    editorPage.index = 0;
    await editorPage.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: true, width: 100 } } },
      { insert: { video: 'https://quilljs.com/' } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await page.waitForTimeout(1000);

    await editorPage.setSelection(2, 0);
    await page.keyboard.press('Enter');
    await expect(page.locator('#editor1 .ql-table-wrapper .ql-table-cell-inner iframe').nth(0)).toBeVisible();
    await expect(page.locator('#editor1 .ql-table-wrapper .ql-table-cell-inner p').nth(0)).toBeVisible();
    const delta = await editorPage.getContents();
    const contents = [
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: true, width: 100 } } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td' } }, insert: '\n' },
      { insert: { video: 'https://quilljs.com/' } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td' } }, insert: '\n' },
      { insert: '\n' },
    ];
    for (const [i, op] of delta.ops.entries()) {
      expect(op).toStrictEqual(contents[i]);
    }
  });

  extendTest('cursor at the end of BlockEmbed', async ({ page, editorPage }) => {
    editorPage.index = 0;
    await editorPage.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: true, width: 100 } } },
      { insert: { video: 'https://quilljs.com/' } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await page.waitForTimeout(1000);

    await editorPage.setSelection(3, 0);
    await page.keyboard.press('Enter');
    await expect(page.locator('#editor1 .ql-table-wrapper .ql-table-cell-inner p').nth(0)).toBeVisible();
    await expect(page.locator('#editor1 .ql-table-wrapper .ql-table-cell-inner iframe').nth(0)).toBeVisible();
    const delta = await editorPage.getContents();
    const contents = [
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: true, width: 100 } } },
      { insert: { video: 'https://quilljs.com/' } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td' } }, insert: '\n\n' },
      { insert: '\n' },
    ];
    for (const [i, op] of delta.ops.entries()) {
      expect(op).toStrictEqual(contents[i]);
    }
  });

  extendTest('selection multiple line', async ({ page, editorPage }) => {
    editorPage.index = 0;
    await editorPage.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: true, width: 100 } } },
      { insert: { video: 'https://quilljs.com/' } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '123' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '123' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
    ]);
    await page.waitForTimeout(1000);

    await editorPage.setSelection(3, 7);
    await page.keyboard.press('Enter');
    await expect(page.locator('#editor1 .ql-table-wrapper .ql-table-cell-inner p')).toHaveCount(1);
  });
});

extendTest.describe('table cell keyboard handler ArrowUp and ArrowDown', () => {
  extendTest('test TableSelection should update when selection change', async ({ page, editorPage }) => {
    editorPage.index = 0;
    await createTableBySelect(page, 'container1', 3, 3);

    await page.locator('#editor1 .ql-table .ql-table-cell').nth(0).click();
    const selectionLine = page.locator('#container1 .table-up-selection .table-up-selection__line');
    await expect(selectionLine).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await expect(selectionLine).toBeVisible();
    const newSelectionWrapper = (await selectionLine.boundingBox())!;
    expect(newSelectionWrapper).not.toBeNull();
    const cell1Bound = (await page.locator('#editor1 .ql-editor td').nth(1).boundingBox())!;
    expect(cell1Bound).not.toBeNull();
    expect(cell1Bound).toEqual(newSelectionWrapper);
  });

  extendTest('test TableSelection and TableMenuSelect should hide when selection out table', async ({ page }) => {
    await createTableBySelect(page, 'container1', 3, 3);
    const firstCell1 = page.locator('#editor1').getByRole('cell').nth(0);
    await firstCell1.click();
    expect(page.locator('#container1 .table-up-selection')).toBeVisible();

    await page.keyboard.down('ArrowUp');
    expect(page.locator('#container1 .table-up-selection')).not.toBeVisible();

    await firstCell1.click();
    await firstCell1.click({ button: 'right' });
    await expect(page.locator('#container1 .table-up-selection')).toBeVisible();
    await expect(page.locator('.table-up-menu.is-contextmenu')).toBeVisible();

    await page.keyboard.down('ArrowUp');
    await expect(page.locator('#container1 .table-up-selection')).not.toBeVisible();
    await expect(page.locator('.table-up-menu.is-contextmenu')).not.toBeVisible();

    await createTableBySelect(page, 'container2', 3, 3);
    const firstCell2 = page.locator('#editor2').getByRole('cell').nth(0);
    await firstCell2.click();
    await expect(page.locator('#container2 .table-up-selection')).toBeVisible();

    await page.keyboard.down('ArrowUp');
    await expect(page.locator('#container2 .table-up-selection')).not.toBeVisible();

    await firstCell2.click();
    await expect(page.locator('#container2 .table-up-selection')).toBeVisible();
    await expect(page.locator('#container2 .table-up-menu')).toBeVisible();

    await page.keyboard.down('ArrowUp');
    await expect(page.locator('#container2 .table-up-selection')).not.toBeVisible();
    await expect(page.locator('#container2 .table-up-menu')).not.toBeVisible();
  });

  extendTest('test table keyboard ArrowUp and ArrowDown should work', async ({ page, editorPage }) => {
    editorPage.index = 0;
    editorPage.setContents([
      { insert: '123456\n' },
      { insert: { 'table-up-col': { tableId: 'njo6syk0zqb', colId: 'mnpytyt1cno', full: false, width: 291 } } },
      { insert: { 'table-up-col': { tableId: 'njo6syk0zqb', colId: '6ihx044tflt', full: false, width: 291 } } },
      { insert: { 'table-up-col': { tableId: 'njo6syk0zqb', colId: 'raiomwr9yuc', full: false, width: 291 } } },
      { insert: { 'table-up-col': { tableId: 'njo6syk0zqb', colId: 'qiuz7k09q6r', full: false, width: 291 } } },
      { insert: '123' },
      { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'rvwpsb2pky', colId: 'mnpytyt1cno', rowspan: 2, colspan: 2 } }, insert: '\n' },
      { insert: '123456' },
      { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'rvwpsb2pky', colId: 'mnpytyt1cno', rowspan: 2, colspan: 2 } }, insert: '\n' },
      { insert: '123' },
      { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'rvwpsb2pky', colId: 'mnpytyt1cno', rowspan: 2, colspan: 2 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'rvwpsb2pky', colId: 'raiomwr9yuc', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'rvwpsb2pky', colId: 'qiuz7k09q6r', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '123' },
      { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'vhg5x933cs', colId: 'raiomwr9yuc', rowspan: 1, colspan: 2 } }, insert: '\n' },
      { insert: '123456' },
      { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'vhg5x933cs', colId: 'raiomwr9yuc', rowspan: 1, colspan: 2 } }, insert: '\n' },
      { insert: '123' },
      { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'vhg5x933cs', colId: 'raiomwr9yuc', rowspan: 1, colspan: 2 } }, insert: '\n' },
      { insert: '12345' },
      { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'nsb7mrygbk9', colId: 'mnpytyt1cno', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'nsb7mrygbk9', colId: '6ihx044tflt', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'nsb7mrygbk9', colId: 'raiomwr9yuc', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'njo6syk0zqb', rowId: 'nsb7mrygbk9', colId: 'qiuz7k09q6r', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '123456\n' },
    ]);

    await editorPage.setSelection(50, 0);
    await page.keyboard.press('ArrowUp');
    expect((await editorPage.getSelection())!.index).toBe(39);

    await editorPage.setSelection(48, 0);
    await page.keyboard.press('ArrowUp');
    expect((await editorPage.getSelection())!.index).toBe(25);

    await editorPage.setSelection(14, 0);
    await page.keyboard.press('ArrowUp');
    expect((await editorPage.getSelection())!.index).toBe(6);

    await editorPage.setSelection(25, 0);
    await page.keyboard.press('ArrowDown');
    expect((await editorPage.getSelection())!.index).toBe(46);

    await editorPage.setSelection(26, 0);
    await page.keyboard.press('ArrowDown');
    expect((await editorPage.getSelection())!.index).toBe(28);

    await editorPage.setSelection(48, 0);
    await page.keyboard.press('ArrowDown');
    expect((await editorPage.getSelection())!.index).toBe(52);

    await editorPage.setSelection(50, 0);
    await page.keyboard.press('ArrowDown');
    expect((await editorPage.getSelection())!.index).toBe(52);
  });

  extendTest('test TableSelection should update when selection change and menu display', async ({ page, editorPage }) => {
    editorPage.index = 0;
    await createTableBySelect(page, 'container1', 3, 3);

    await page.locator('#editor1 .ql-table .ql-table-cell').nth(0).click();
    const selectionLine = page.locator('#container1 .table-up-selection .table-up-selection__line');
    await expect(selectionLine).toBeVisible();

    await page.locator('#editor1 .ql-table .ql-table-cell').nth(0).click({ button: 'right' });
    await expect(page.locator('.table-up-menu.is-contextmenu')).toBeVisible();

    await page.locator('.table-up-menu.is-contextmenu .table-up-menu__item').filter({ hasText: 'Set background color' }).first().click();
    await page.waitForTimeout(1000);
    await expect(selectionLine).not.toBeVisible();

    await page.keyboard.press('ArrowDown');
    await expect(selectionLine).not.toBeVisible();
    await expect(page.locator('.table-up-menu.is-contextmenu')).toBeVisible();
  });
});

extendTest.describe('TableSelection keyboard handler', () => {
  extendTest('backspace should not remove cell content when focus element not in editor', async ({ page, editorPage }) => {
    editorPage.index = 0;
    await editorPage.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 121 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 121 } } },
      { attributes: { link: 'www.any.link' }, insert: 'some text' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td' } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td' } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td' } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td' } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await page.waitForTimeout(1000);

    const bounding = (await page.locator('#editor1 .ql-table-wrapper .ql-table-cell-inner p').nth(0).boundingBox())!;
    await page.mouse.click(bounding.x, bounding.y + bounding.height * 0.5);
    await page.locator('#editor1 .ql-tooltip .ql-action').click();
    await page.locator('#editor1 .ql-tooltip input').nth(0).click();
    await page.keyboard.press('Backspace');

    expect(await page.locator('#editor1 .ql-tooltip input').nth(0).inputValue()).toBe('www.any.lin');
    expect(await page.locator('#editor1 .ql-table-wrapper .ql-table-cell-inner p').nth(0).textContent()).toBe('some text');
  });

  extendTest('should handle delete table cell text when selected tds', async ({ page, editorPage }) => {
    editorPage.index = 0;
    await editorPage.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 121 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 121 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 121 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);

    await expect(page.locator('#editor1 .ql-table .ql-table-cell').nth(0)).toHaveText('1');
    await expect(page.locator('#editor1 .ql-table .ql-table-cell').nth(1)).toHaveText('2');

    const cell1 = page.locator('#editor1 .ql-editor .ql-table td').nth(0);
    const cell1Bounding = (await cell1.boundingBox())!;
    expect(cell1Bounding).not.toBeNull();
    await cell1.click();
    const selectionLine = page.locator('#container1 .table-up-selection .table-up-selection__line');
    await expect(selectionLine).toBeVisible();

    await page.mouse.down();
    await page.mouse.move(cell1Bounding.x + cell1Bounding.width * 1.5, cell1Bounding.y + cell1Bounding.height / 2);
    await page.mouse.up();
    await editorPage.blur();
    await page.dispatchEvent('body', 'keydown', {
      key: 'Backspace',
      code: 'Backspace',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
    });

    await expect(page.locator('#editor1 .ql-table .ql-table-cell').nth(0)).toHaveText('');
    await expect(page.locator('#editor1 .ql-table .ql-table-cell').nth(1)).toHaveText('');

    const cell8 = page.locator('#editor1 .ql-editor .ql-table td').nth(8);
    const cell8Bounding = (await cell8.boundingBox())!;
    expect(cell8Bounding).not.toBeNull();
    await cell8.click();
    await page.mouse.down();
    await page.mouse.move(cell8Bounding.x - cell8Bounding.width * 0.5, cell8Bounding.y + cell8Bounding.height / 2);
    await page.mouse.up();
    await editorPage.blur();
    await page.dispatchEvent('body', 'keydown', {
      key: 'Backspace',
      code: 'Backspace',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
    });

    await expect(page.locator('#editor1 .ql-table .ql-table-cell').nth(8)).toHaveText('');
    await expect(page.locator('#editor1 .ql-table .ql-table-cell').nth(7)).toHaveText('');
  });

  extendTest('should delete table when selected all cells and press delete', async ({ page, editorPage }) => {
    editorPage.index = 0;
    await editorPage.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 121 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 121 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 121 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    const cell1 = page.locator('#editor1 .ql-editor .ql-table td').nth(0);
    const cell1Bounding = (await cell1.boundingBox())!;
    expect(cell1Bounding).not.toBeNull();
    await cell1.click();
    const selectionLine = page.locator('#container1 .table-up-selection .table-up-selection__line');
    await expect(selectionLine).toBeVisible();

    await page.mouse.down();
    await page.mouse.move(cell1Bounding.x + cell1Bounding.width * 2.5, cell1Bounding.y + cell1Bounding.height * 2.5);
    await page.mouse.up();
    await editorPage.blur();
    await page.dispatchEvent('body', 'keydown', {
      key: 'Backspace',
      code: 'Backspace',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
    });

    expect(await page.locator('#editor1 .ql-table').count()).toBe(0);
  });
});
