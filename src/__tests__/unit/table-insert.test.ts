import type { TableMainFormat } from '../../formats';
import Quill from 'quill';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TableCellInnerFormat } from '../../formats';
import { TableUp } from '../../table-up';
import { createQuillWithTableModule, createTable, createTableBodyHTML, createTableDeltaOps, createTableHTML, createTaleColHTML, datasetAlign, datasetFull, expectDelta } from './utils';

const Delta = Quill.import('delta');

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('insert embed blot', () => {
  it('insert image', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: 'true', width: 100 } } },
      { insert: { image: 'https://live.mdnplay.dev/en-US/docs/Web/HTML/Element/img/favicon144.png' } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            <colgroup data-full="true">
             <col width="100%" data-full="true" />
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1">
                  <div>
                    <p><img src="https://live.mdnplay.dev/en-US/docs/Web/HTML/Element/img/favicon144.png" /></p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });
});

describe('insert block blot', () => {
  it('insert list', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: 'true', width: 100 } } },
      { insert: 'text' },
      { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            <colgroup data-full="true">
            <col width="100%" data-full="true" />
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1">
                  <div>
                    <ol>
                      <li data-list="bullet">text</li>
                    </ol>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('insert header', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: 'true', width: 100 } } },
      { insert: 'text' },
      { attributes: { 'header': 2, 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
      <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            <colgroup data-full="true">
            <col width="100%" data-full="true" />
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1">
                  <div>
                    <h2>text</h2>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('insert blockquote', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: 'true', width: 100 } } },
      { insert: 'text' },
      { attributes: { 'blockquote': true, 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            <colgroup data-full="true">
            <col width="100%" data-full="true" />
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1">
                  <div>
                    <blockquote>text</blockquote>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('insert code-block', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: 'true', width: 100 } } },
      { insert: 'text' },
      { attributes: { 'code-block': 'plain', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: 'br' },
      { attributes: { 'code-block': 'plain', 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            <colgroup data-full="true">
            <col width="100%" data-full="true" />
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1">
                  <div>
                    <div spellcheck="false">
                      <div data-language="plain">text</div>
                      <div data-language="plain">br</div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });
});

describe('insert block embed blot', () => {
  it('insert video', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: 'true', width: 100 } } },
      { insert: { video: 'https://quilljs.com/' } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            <colgroup data-full="true">
              <col width="100%" data-full="true" />
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1">
                  <div>
                    <iframe src="https://quilljs.com/" frameborder="0" allowfullscreen="true"></iframe>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('BlockEmbed should at correct position in cell', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '2l7117zsa6r', colId: 'd962746f4w8', full: false, width: 100 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '2l7117zsa6r', rowId: 'a9r52q9z4l', colId: 'd962746f4w8', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: { video: 'http://localhost:5500/docs/index.html' } },
      { insert: 'bbb' },
      { attributes: { 'table-up-cell-inner': { tableId: '2l7117zsa6r', rowId: 'a9r52q9z4l', colId: 'd962746f4w8', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0">
            ${createTaleColHTML(1, { full: false, width: 100 })}
            <tbody>
              <tr>
                <td rowspan="1" colspan="1">
                  <div>
                    <p>1</p>
                    <iframe frameborder="0" allowfullscreen="true" src="http://localhost:5500/docs/index.html"></iframe>
                    <p>bbb</p>
                  </div>
                </td
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('makesure the text delta order is correct', () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: 'true', width: 100 } } },
      { insert: { video: 'https://quilljs.com/' } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n\n' },
      { insert: '\n' },
    ]);

    quill.insertText(4, '123');

    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            <colgroup data-full="true">
              <col width="100%" data-full="true" />
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1">
                  <div>
                    <iframe src="https://quilljs.com/" frameborder="0" allowfullscreen="true"></iframe>
                    <p>123</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: true, width: 100 } } },
        { insert: { video: 'https://quilljs.com/' } },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '123' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );
  });
});

describe('set contents', () => {
  it('should optimize correctly', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(createTableDeltaOps(3, 3));
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(3, 3)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('should get correct prop', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(createTableDeltaOps(3, 3, { full: false, width: 200, align: 'center' }));
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(3, 3, { full: false, width: 200, align: 'center' })}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'contenteditable'] },
    );
  });

  it('should display an empty table', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(createTableDeltaOps(2, 2, {}, {}, { isEmpty: true }));
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(2, 2, {}, undefined, { isEmpty: true })}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('delta should render save construct', async () => {
    const quill = await createTable(3, 2);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.setCellAttrs([tds[0], tds[1]], 'background-color', 'red', true);
    tableModule.setCellAttrs([tds[2], tds[3]], 'border-color', 'red', true);
    tableModule.setCellAttrs([tds[4], tds[5]], 'height', '50px', true);
    await vi.runAllTimersAsync();
    const delta = quill.getContents();
    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: true, width: 50 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: true, width: 50 } } },
        { insert: '1' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody', style: 'background-color: red; border-bottom-color: red;' } }, insert: '\n' },
        { insert: '2' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody', style: 'background-color: red; border-bottom-color: red;' } }, insert: '\n' },
        { insert: '3' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody', style: 'border-color: red;' } }, insert: '\n' },
        { insert: '4' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody', style: 'border-color: red;' } }, insert: '\n' },
        { insert: '5' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody', style: 'height: 50px;' } }, insert: '\n' },
        { insert: '6' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody', style: 'height: 50px;' } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );
    quill.setContents([{ insert: '\n' }]);
    quill.setContents(delta);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p><div>
          <table cellpadding="0" cellspacing="0">
            ${createTaleColHTML(2, { width: 50, full: true })}
            <tbody>
              <tr>
                <td style="backround-color: red;">
                  <div><p>1</p></div>
                </td>
                <td style="backround-color: red;">
                  <div><p>2</p></div>
                </td>
              </tr>
              <tr>
                <td style="border-color: red;">
                  <div><p>3</p></div>
                </td>
                <td style="border-color: red;">
                  <div><p>4</p></div>
                </td>
              </tr>
              <tr>
                <td style="height: 50px;">
                  <div><p>5</p></div>
                </td>
                <td style="height: 50px;">
                  <div><p>6</p></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'rowspan', 'colspan', 'data-full', 'data-style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });
});

describe('column width calculate', () => {
  it('should calculate correct width', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(createTableDeltaOps(3, 3, { full: false }));
    await vi.runAllTimersAsync();
    expect(quill.root.querySelectorAll('table')[0].style.width).toBe('300px');
  });
});

describe('insert row into table', () => {
  it('insert row top', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    tableModule.insertTable(2, 2);
    await vi.runAllTimersAsync();
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.appendRow([tds[0]], false);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            <colgroup data-full="true">
              <col width="50%" data-full="true" />
              <col width="50%" data-full="true" />
            </colgroup>
            <tbody>
              ${
                new Array(3).fill(0).map(() => `
                  <tr>
                    ${new Array(2).fill(0).map(() => `<td rowspan="1" colspan="1"><div><p><br></p></div></td>`).join('\n')}
                  </tr>
                `).join('\n')
              }
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('insert row top and index is inside rowspan cell', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    tableModule.insertTable(3, 5);
    await vi.runAllTimersAsync();
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[0], tds[1], tds[2], tds[5], tds[6], tds[7]]);
    await vi.runAllTimersAsync();
    tableModule.mergeCells([tds[9], tds[14]]);
    await vi.runAllTimersAsync();
    tableModule.appendRow([tds[8]], false);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            <colgroup data-full="true">
              ${new Array(5).fill(0).map(() => `<col width="20%" data-full="true" />`).join('\n')}
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="3" colspan="3">
                  <div>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                  </div>
                </td>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
                <td rowspan="2" colspan="1">
                  <div>
                    <p><br></p>
                    <p><br></p>
                  </div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('insert row bottom', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    tableModule.insertTable(2, 2);
    await vi.runAllTimersAsync();
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.appendRow([tds[2]], true);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            <colgroup data-full="true">
              <col width="50%" data-full="true" />
              <col width="50%" data-full="true" />
            </colgroup>
            <tbody>
              ${
                new Array(3).fill(0).map(() => `
                  <tr>
                    ${new Array(2).fill(0).map(() => `<td rowspan="1" colspan="1"><div><p><br></p></div></td>`).join('\n')}
                  </tr>
                `).join('\n')
              }
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });

  it('insert row bottom and index is inside rowspan cell', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    tableModule.insertTable(2, 5);
    await vi.runAllTimersAsync();
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[1], tds[2], tds[3], tds[6], tds[7], tds[8]]);
    tableModule.appendRow([tds[0]], true);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            <colgroup data-full="true">
              <col width="20%" data-full="true" />
              <col width="60%" data-full="true" />
              <col width="20%" data-full="true" />
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
                <td rowspan="3" colspan="1">
                  <div>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                  </div>
                </td>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
                <td rowspan="1" colspan="1"><div><p><br></p></div></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });
});

describe('set cell attribute', () => {
  it('set bg color', async () => {
    const quill = await createTable(3, 3);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.setCellAttrs([tds[0], tds[1], tds[2]], 'background-color', 'rgb(253, 235, 255)', true);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0"${datasetFull(true)} style="margin-right: auto;">
            ${createTaleColHTML(3)}
            <tbody>
              ${
                new Array(3).fill(0).map((_, i) => `
                  <tr data-row-id="${i + 1}">
                    ${
                      new Array(3).fill(0).map((_, j) => `<td rowspan="1" colspan="1" data-row-id="${i + 1}" data-col-id="${j + 1}"${i === 0 ? ' style="background-color: rgb(253, 235, 255);"' : ''}>
                        <div data-rowspan="1" data-colspan="1" data-row-id="${i + 1}" data-col-id="${j + 1}"${i === 0 ? ' data-style="background-color: rgb(253, 235, 255);"' : ''}><p>${i * 3 + j + 1}</p></div>
                      </td>`).join('\n')
                    }
                  </tr>
                `).join('\n')
              }
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'data-table-id', 'contenteditable'] },
    );
  });

  it('set border color', async () => {
    const quill = await createTable(2, 2);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.setCellAttrs([tds[0], tds[1]], 'border-color', 'red', true);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0"${datasetFull(true)} style="margin-right: auto;">
            ${createTaleColHTML(2)}
            <tbody>
              <tr data-row-id="1">
                <td colspan="1" data-col-id="1" data-row-id="1" rowspan="1" style="border-color: red;">
                  <div data-col-id="1" data-colspan="1" data-row-id="1" data-rowspan="1" data-style="border-color: red;">
                    <p>1</p>
                  </div>
                </td>
                <td colspan="1" data-col-id="2" data-row-id="1" rowspan="1" style="border-color: red;">
                  <div data-col-id="2" data-colspan="1" data-row-id="1" data-rowspan="1" data-style="border-color: red;">
                    <p>2</p>
                  </div>
                </td>
              </tr>
              <tr data-row-id="2">
                <td colspan="1" data-col-id="1" data-row-id="2" rowspan="1">
                  <div data-col-id="1" data-colspan="1" data-row-id="2" data-rowspan="1">
                    <p>3</p>
                  </div>
                </td>
                <td colspan="1" data-col-id="2" data-row-id="2" rowspan="1">
                  <div data-col-id="2" data-colspan="1" data-row-id="2" data-rowspan="1">
                    <p>4</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['data-wrap-tag', 'data-tag', 'class', 'data-table-id', 'contenteditable'] },
    );
    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: true, width: 50 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: true, width: 50 } } },
        { insert: '1' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody', style: 'border-color: red;' } }, insert: '\n' },
        { insert: '2' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody', style: 'border-color: red;' } }, insert: '\n' },
        { insert: '3' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '4' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );
  });

  it('set table align change', async () => {
    const quill = await createTable(3, 3, { full: false, width: 100 });
    const table = quill.root.querySelector('table')!;
    const tableBlot = Quill.find(table) as TableMainFormat;
    const cols = tableBlot.getCols();
    for (const col of cols) {
      col.align = 'center';
    }
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0"${datasetAlign('center')} style="margin-right: auto; width: 300px; margin-left: auto;">
            ${createTaleColHTML(3, { align: 'center', full: false, width: 100 })}
            ${createTableBodyHTML(3, 3)}
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'data-table-id', 'contenteditable'] },
    );
  });

  it('set span cell border color', async () => {
    const quill = await createTable(5, 5, {}, {}, { isEmpty: true });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;

    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[6], tds[7], tds[8], tds[11], tds[12], tds[13], tds[16], tds[17], tds[18]]);
    const mergedTds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.setCellAttrs([mergedTds[6]], 'border-color', 'red', true);

    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: true, width: 20 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: true, width: 20 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '3', full: true, width: 20 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '4', full: true, width: 20 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '5', full: true, width: 20 } } },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody', style: 'border-bottom-color: red;' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody', style: 'border-bottom-color: red;' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody', style: 'border-bottom-color: red;' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody', style: 'border-right-color: red;' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 3, colspan: 3, tag: 'td', wrapTag: 'tbody', style: 'border-color: red;' } }, insert: '\n\n\n\n\n\n\n\n\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody', style: 'border-right-color: red;' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody', style: 'border-right-color: red;' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '5', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );
  });

  it('set rowspan and colspan cell border color', async () => {
    const quill = await createTable(6, 4, {}, {}, { isEmpty: true });
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;

    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.mergeCells([tds[4], tds[5], tds[8], tds[9]]);
    await vi.runAllTimersAsync();
    tableModule.mergeCells([tds[13], tds[14], tds[17], tds[18]]);
    await vi.runAllTimersAsync();
    const mergedTds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.setCellAttrs([mergedTds[10]], 'border-color', 'red', true);

    await vi.runAllTimersAsync();
    expectDelta(
      quill.getContents(),
      new Delta([
        { insert: '\n' },
        { insert: { 'table-up-col': { tableId: '1', colId: '1', full: true, width: 25 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '2', full: true, width: 25 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '3', full: true, width: 25 } } },
        { insert: { 'table-up-col': { tableId: '1', colId: '4', full: true, width: 25 } } },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },

        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 2, colspan: 2, tag: 'td', wrapTag: 'tbody' } }, insert: '\n\n\n\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },

        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody', style: 'border-bottom-color: red;' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },

        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody', style: 'border-right-color: red;' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '2', rowspan: 2, colspan: 2, tag: 'td', wrapTag: 'tbody', style: 'border-color: red;' } }, insert: '\n\n\n\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },

        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody', style: 'border-right-color: red;' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '5', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },

        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '6', colId: '1', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '6', colId: '2', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '6', colId: '3', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '6', colId: '4', rowspan: 1, colspan: 1, tag: 'td', wrapTag: 'tbody' } }, insert: '\n' },
        { insert: '\n' },
      ]),
    );
  });
});

describe('cell editable', () => {
  it('quill enable hack should useable when initial readOnly `false`', async () => {
    const quill = await createTable(3, 3);
    const inners = quill.root.querySelectorAll('.ql-table-cell-inner');
    expect(inners.length).toBe(9);
    for (const inner of Array.from(inners)) {
      expect(inner.getAttribute('contenteditable')).toBe('true');
    }

    quill.disable();
    const disabledInners = quill.root.querySelectorAll('.ql-table-cell-inner');
    expect(disabledInners.length).toBe(9);
    for (const inner of Array.from(disabledInners)) {
      expect(inner.getAttribute('contenteditable')).toBe('false');
    }

    quill.enable(true);
    const enabledInners = quill.root.querySelectorAll('.ql-table-cell-inner');
    expect(enabledInners.length).toBe(9);
    for (const inner of Array.from(enabledInners)) {
      expect(inner.getAttribute('contenteditable')).toBe('true');
    }
  });

  it('quill enable hack should useable when initial readOnly `true`', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, {}, {}, { readOnly: true });
    quill.setContents(createTableDeltaOps(3, 3));
    await vi.runAllTimersAsync();

    const disabledInners = quill.root.querySelectorAll('.ql-table-cell-inner');
    expect(disabledInners.length).toBe(9);
    for (const inner of Array.from(disabledInners)) {
      expect(inner.getAttribute('contenteditable')).toBe('false');
    }

    quill.enable(true);
    const enabledInners = quill.root.querySelectorAll('.ql-table-cell-inner');
    expect(enabledInners.length).toBe(9);
    for (const inner of Array.from(enabledInners)) {
      expect(inner.getAttribute('contenteditable')).toBe('true');
    }
  });

  it('multiple quill editor table cell should effect each other', async () => {
    const quill1 = createQuillWithTableModule(`<p><br></p>`, {}, {}, { readOnly: true });
    quill1.setContents(createTableDeltaOps(3, 3));
    await vi.runAllTimersAsync();
    const quill2 = createQuillWithTableModule(`<p><br></p>`, {}, {}, { readOnly: false });
    quill2.setContents(createTableDeltaOps(3, 3));
    await vi.runAllTimersAsync();

    const disabledInners1 = quill1.root.querySelectorAll('.ql-table-cell-inner');
    expect(disabledInners1.length).toBe(9);
    for (const inner of Array.from(disabledInners1)) {
      expect(inner.getAttribute('contenteditable')).toBe('false');
    }

    const enabledInners2 = quill2.root.querySelectorAll('.ql-table-cell-inner');
    expect(enabledInners2.length).toBe(9);
    for (const inner of Array.from(enabledInners2)) {
      expect(inner.getAttribute('contenteditable')).toBe('true');
    }

    quill1.enable(true);
    const enabledInners1 = quill1.root.querySelectorAll('.ql-table-cell-inner');
    expect(enabledInners1.length).toBe(9);
    for (const inner of Array.from(enabledInners1)) {
      expect(inner.getAttribute('contenteditable')).toBe('true');
    }

    quill2.enable(false);
    const disabledInners2 = quill2.root.querySelectorAll('.ql-table-cell-inner');
    expect(disabledInners2.length).toBe(9);
    for (const inner of Array.from(disabledInners2)) {
      expect(inner.getAttribute('contenteditable')).toBe('false');
    }
  });
});
