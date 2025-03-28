import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TableCellInnerFormat } from '../../formats';
import { TableUp } from '../../table-up';
import { createTable, createTableBodyHTML, createTaleColHTML } from './utils';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('hack html convert', () => {
  it('getSemanticHTML should not get contenteditable table cell', async () => {
    const quill = await createTable(3, 3, { full: false, width: 100, align: 'right' }, { isEmpty: false });
    await vi.runAllTimersAsync();
    const html = quill.getSemanticHTML();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    expect(doc.body).toEqualHTML(
      `
        <p></p>
        <div contenteditable="false">
          <table cellpadding="0" cellspacing="0" style="margin-left: auto; width: 300px;" data-align="right">
            ${createTaleColHTML(3, { full: false, width: 100, align: 'right' })}
            ${createTableBodyHTML(3, 3, { isEmpty: false, editable: false })}
          </table>
        </div>
        <p></p>
      `,
      { ignoreAttrs: ['class', 'data-table-id'] },
    );
  });

  it('getHTMLByCell should not get contenteditable table cell', async () => {
    const quill = await createTable(3, 3, { full: false, width: 100, align: 'right' }, { isEmpty: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    const html = tableModule.getHTMLByCell([tds[0], tds[1], tds[3], tds[4]]);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    expect(doc.body).toEqualHTML(
      `
        <div contenteditable="false">
          <table cellpadding="0" cellspacing="0" style="margin-left: auto; width: 200px;" data-align="right">
            <colgroup contenteditable="false" data-align="right">
              <col width="100px" data-col-id="1" data-align="right" />
              <col width="100px" data-col-id="2" data-align="right" />
            </colgroup>
            <tbody>
              <tr data-row-id="1">
                <td colspan="1" data-col-id="1" data-row-id="1" rowspan="1">
                  <div data-col-id="1" data-colspan="1" data-row-id="1" data-rowspan="1">
                    <p>1</p>
                  </div>
                </td>
                <td colspan="1" data-col-id="2" data-row-id="1" rowspan="1">
                  <div data-col-id="2" data-colspan="1" data-row-id="1" data-rowspan="1">
                    <p>2</p>
                  </div>
                </td>
              </tr>
              <tr data-row-id="2">
                <td colspan="1" data-col-id="1" data-row-id="2" rowspan="1">
                  <div data-col-id="1" data-colspan="1" data-row-id="2" data-rowspan="1">
                    <p>4</p>
                  </div>
                </td>
                <td colspan="1" data-col-id="2" data-row-id="2" rowspan="1">
                  <div data-col-id="2" data-colspan="1" data-row-id="2" data-rowspan="1">
                    <p>5</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `,
      { ignoreAttrs: ['class', 'data-table-id'] },
    );
  });

  it('getHTMLByCell should not get contenteditable table cell with attribute', async () => {
    const quill = await createTable(4, 4, { full: true, width: 100 }, { isEmpty: false });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    const html = tableModule.getHTMLByCell([tds[0], tds[1], tds[4], tds[5]]);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    expect(doc.body).toEqualHTML(
      `
        <div contenteditable="false">
          <table cellpadding="0" cellspacing="0" style="margin-right: auto;" data-full="true">
            <colgroup contenteditable="false" data-full="true">
              <col width="50%" data-col-id="1" data-full="true" />
              <col width="50%" data-col-id="2" data-full="true" />
            </colgroup>
            <tbody>
              <tr data-row-id="1">
                <td colspan="1" data-col-id="1" data-row-id="1" rowspan="1">
                  <div data-col-id="1" data-colspan="1" data-row-id="1" data-rowspan="1">
                    <p>1</p>
                  </div>
                </td>
                <td colspan="1" data-col-id="2" data-row-id="1" rowspan="1">
                  <div data-col-id="2" data-colspan="1" data-row-id="1" data-rowspan="1">
                    <p>2</p>
                  </div>
                </td>
              </tr>
              <tr data-row-id="2">
                <td colspan="1" data-col-id="1" data-row-id="2" rowspan="1">
                  <div data-col-id="1" data-colspan="1" data-row-id="2" data-rowspan="1">
                    <p>5</p>
                  </div>
                </td>
                <td colspan="1" data-col-id="2" data-row-id="2" rowspan="1">
                  <div data-col-id="2" data-colspan="1" data-row-id="2" data-rowspan="1">
                    <p>6</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `,
      { ignoreAttrs: ['class', 'data-table-id'] },
    );
  });
});
