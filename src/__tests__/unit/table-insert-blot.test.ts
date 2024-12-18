import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TableUp, { TableCellInnerFormat } from '../..';
import { createQuillWithTableModule, createTable, createTableDeltaOps, createTableHTML } from './utils';

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
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
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
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
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
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
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
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
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
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
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
                    <p><br></p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
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
    quill.setContents(createTableDeltaOps(2, 2, {}, { isEmpty: true }));
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(2, 2, {}, { isEmpty: true })}
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
    const insertGetHTML = quill.root.innerHTML;
    expect(delta.ops).toEqual([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: true, width: 50 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: true, width: 50 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1, style: 'background-color: red;' } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1, style: 'background-color: red;' } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1, style: 'border-color: red;' } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1, style: 'border-color: red;' } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1, style: 'height: 50px;' } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1, style: 'height: 50px;' } }, insert: '\n' },
      { insert: '\n' },
    ]);
    quill.setContents([{ insert: '\n' }]);
    quill.setContents(delta);
    await vi.runAllTimersAsync();
    expect(quill.root.innerHTML).toBe(insertGetHTML);
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

describe('html convert', () => {
  it('should convert html code-block correctly', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({ html: '<div class="ql-table-wrapper" data-table-id="1"><table data-table-id="1" class="ql-table" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 363px;"><colgroup data-table-id="1" contenteditable="false"><col width="121px" data-table-id="1" data-col-id="1"><col width="121px" data-table-id="1" data-col-id="2"><col width="121px" data-table-id="1" data-col-id="3"></colgroup><tbody data-table-id="1"><tr class="ql-table-row" data-table-id="1" data-row-id="1"><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="1" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="1" data-rowspan="1" data-colspan="1"><p>1</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="2" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="2" data-rowspan="1" data-colspan="1"><p>2</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="3" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="3" data-rowspan="1" data-colspan="1"><p>3</p></div></td></tr><tr class="ql-table-row" data-table-id="1" data-row-id="2"><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="1" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="1" data-rowspan="1" data-colspan="1"><p>4</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="2" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="2" data-rowspan="1" data-colspan="1"><div class="ql-code-block-container" spellcheck="false"><div class="ql-code-block" data-language="plain">5</div><div class="ql-code-block" data-language="plain">5</div><div class="ql-code-block" data-language="plain">5</div></div><p>5</p><p>5</p><p>5</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="3" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="3" data-rowspan="1" data-colspan="1"><p>6</p></div></td></tr><tr class="ql-table-row" data-table-id="1" data-row-id="3"><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="1" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="1" data-rowspan="1" data-colspan="1"><p>7</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="2" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="2" data-rowspan="1" data-colspan="1"><p>8</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="3" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="3" data-rowspan="1" data-colspan="1"><p>9</p></div></td></tr></tbody></table></div>' }),
    );
    await vi.runAllTimersAsync();

    const ops = quill.getContents().ops;
    const resultOps = [
      { insert: '\n' },
      { insert: { 'table-up-col': { full: false, width: 121 } } },
      { insert: { 'table-up-col': { full: false, width: 121 } } },
      { insert: { 'table-up-col': { full: false, width: 121 } } },
      { insert: '1' },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '2' },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '3' },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '4' },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'code-block': 'plain', 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'code-block': 'plain', 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'code-block': 'plain', 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '6' },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '7' },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '8' },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '9' },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ];
    for (const [i, op] of ops.entries()) {
      expect(op).toMatchObject(resultOps[i]);
    }
  });

  it('should convert html header correctly', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({ html: '<div class="ql-table-wrapper" data-table-id="rlabchug06i"><table data-table-id="rlabchug06i" class="ql-table" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 1166px;"><colgroup data-table-id="rlabchug06i" contenteditable="false"><col width="583px" data-table-id="rlabchug06i" data-col-id="ss993p1sqx"><col width="583px" data-table-id="rlabchug06i" data-col-id="2ixexk4mapx"></colgroup><tbody data-table-id="rlabchug06i"><tr class="ql-table-row" data-table-id="rlabchug06i" data-row-id="fvvkgpv86zw"><td class="ql-table-cell" data-table-id="rlabchug06i" data-row-id="fvvkgpv86zw" data-col-id="ss993p1sqx" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="rlabchug06i" data-row-id="fvvkgpv86zw" data-col-id="ss993p1sqx" data-rowspan="1" data-colspan="1"><h1>header1</h1></div></td><td class="ql-table-cell" data-table-id="rlabchug06i" data-row-id="fvvkgpv86zw" data-col-id="2ixexk4mapx" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="rlabchug06i" data-row-id="fvvkgpv86zw" data-col-id="2ixexk4mapx" data-rowspan="1" data-colspan="1"><h3>header3</h3></div></td></tr></tbody></table></div>' }),
    );
    await vi.runAllTimersAsync();

    const ops = quill.getContents().ops;
    const resultOps = [
      { insert: '\n' },
      { insert: { 'table-up-col': { full: false, width: 583 } } },
      { insert: { 'table-up-col': { full: false, width: 583 } } },
      { insert: 'header1' },
      { attributes: { 'header': 1, 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: 'header3' },
      { attributes: { 'header': 3, 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ];
    for (const [i, op] of ops.entries()) {
      expect(op).toMatchObject(resultOps[i]);
    }
  });

  it('should convert html image correctly', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({ html: '<div class="ql-table-wrapper" data-table-id="7oymehdtx0k"><table data-table-id="7oymehdtx0k" data-full="true" class="ql-table" cellpadding="0" cellspacing="0" style="margin-right: auto;"><colgroup data-table-id="7oymehdtx0k" data-full="true" contenteditable="false"><col width="100%" data-full="true" data-table-id="7oymehdtx0k" data-col-id="hr7qo4t2dus"></colgroup><tbody data-table-id="7oymehdtx0k"><tr class="ql-table-row" data-table-id="7oymehdtx0k" data-row-id="69gog08ow04"><td class="ql-table-cell" data-table-id="7oymehdtx0k" data-row-id="69gog08ow04" data-col-id="hr7qo4t2dus" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="7oymehdtx0k" data-row-id="69gog08ow04" data-col-id="hr7qo4t2dus" data-rowspan="1" data-colspan="1"><p><img src="https://upload-bbs.miyoushe.com/upload/2024/06/18/5556092/73b7bae28fded7a72d93a35d5559b24c_3979852353547906724.png"></p></div></td></tr></tbody></table></div>' }),
    );
    await vi.runAllTimersAsync();

    const ops = quill.getContents().ops;
    const resultOps = [
      { insert: '\n' },
      { insert: { 'table-up-col': { full: true, width: 100 } } },
      { insert: { image: 'https://upload-bbs.miyoushe.com/upload/2024/06/18/5556092/73b7bae28fded7a72d93a35d5559b24c_3979852353547906724.png' } },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ];
    for (const [i, op] of ops.entries()) {
      expect(op).toMatchObject(resultOps[i]);
    }
  });

  it('should convert html video correctly', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({ html: '<div class="ql-table-wrapper" data-table-id="1"><table data-table-id="1" data-full="true" class="ql-table" cellpadding="0" cellspacing="0" style="margin-right: auto;"><colgroup data-table-id="1" data-full="true" contenteditable="false"><col width="100%" data-full="true" data-table-id="1" data-col-id="1"></colgroup><tbody data-table-id="1"><tr class="ql-table-row" data-table-id="1" data-row-id="1"><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="1" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="1" data-rowspan="1" data-colspan="1"><iframe class="ql-video" frameborder="0" allowfullscreen="true" src="http://127.0.0.1:5500/docs/index.html"></iframe><p><br></p></div></td></tr></tbody></table></div>' }),
    );
    await vi.runAllTimersAsync();

    const ops = quill.getContents().ops;
    const resultOps = [
      { insert: '\n' },
      { insert: { 'table-up-col': { full: true, width: 100 } } },
      { insert: { video: 'http://127.0.0.1:5500/docs/index.html' } },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ];
    for (const [i, op] of ops.entries()) {
      expect(op).toMatchObject(resultOps[i]);
    }
  });

  it('should convert html list correctly', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({ html: '<div class="ql-table-wrapper" data-table-id="ls2bw9dtr6m"><table data-table-id="ls2bw9dtr6m" class="ql-table" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 1166px;"><colgroup data-table-id="ls2bw9dtr6m" contenteditable="false"><col width="583px" data-table-id="ls2bw9dtr6m" data-col-id="p3imc1n7xlo"><col width="583px" data-table-id="ls2bw9dtr6m" data-col-id="ndvtber87yq"></colgroup><tbody data-table-id="ls2bw9dtr6m"><tr class="ql-table-row" data-table-id="ls2bw9dtr6m" data-row-id="bztm23s128n"><td class="ql-table-cell" data-table-id="ls2bw9dtr6m" data-row-id="bztm23s128n" data-col-id="p3imc1n7xlo" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="ls2bw9dtr6m" data-row-id="bztm23s128n" data-col-id="p3imc1n7xlo" data-rowspan="1" data-colspan="1"><ol><li data-list="ordered"><span class="ql-ui" contenteditable="false"></span>list order</li><li data-list="ordered" class="ql-indent-1"><span class="ql-ui" contenteditable="false"></span>aaa</li></ol></div></td><td class="ql-table-cell" data-table-id="ls2bw9dtr6m" data-row-id="bztm23s128n" data-col-id="ndvtber87yq" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="ls2bw9dtr6m" data-row-id="bztm23s128n" data-col-id="ndvtber87yq" data-rowspan="1" data-colspan="1"><ol><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span>list bullet</li></ol></div></td></tr><tr class="ql-table-row" data-table-id="ls2bw9dtr6m" data-row-id="3kx2tsgoao5"><td class="ql-table-cell" data-table-id="ls2bw9dtr6m" data-row-id="3kx2tsgoao5" data-col-id="p3imc1n7xlo" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="ls2bw9dtr6m" data-row-id="3kx2tsgoao5" data-col-id="p3imc1n7xlo" data-rowspan="1" data-colspan="1"><ol><li data-list="unchecked"><span class="ql-ui" contenteditable="false"></span>list checkbox</li><li data-list="checked"><span class="ql-ui" contenteditable="false"></span>checkbox checked</li></ol></div></td><td class="ql-table-cell" data-table-id="ls2bw9dtr6m" data-row-id="3kx2tsgoao5" data-col-id="ndvtber87yq" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="ls2bw9dtr6m" data-row-id="3kx2tsgoao5" data-col-id="ndvtber87yq" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr></tbody></table></div>' }),
    );
    await vi.runAllTimersAsync();

    const ops = quill.getContents().ops;
    const resultOps = [
      { insert: '\n' },
      { insert: { 'table-up-col': { full: false, width: 583 } } },
      { insert: { 'table-up-col': { full: false, width: 583 } } },
      { insert: 'list order' },
      { attributes: { 'list': 'ordered', 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: 'aaa' },
      { attributes: { 'indent': 1, 'list': 'ordered', 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: 'list bullet' },
      { attributes: { 'list': 'bullet', 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: 'list checkbox' },
      { attributes: { 'list': 'unchecked', 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: 'checkbox checked' },
      { attributes: { 'list': 'checked', 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ];
    for (const [i, op] of ops.entries()) {
      expect(op).toMatchObject(resultOps[i]);
    }
  });
});
