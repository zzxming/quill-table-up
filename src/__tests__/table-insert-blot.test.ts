import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQuillWithTableModule, createTableDeltaOps, createTableHTML } from './utils';

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

  it('should display an empty table', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(createTableDeltaOps(2, 2, true, 100, { isEmpty: true }));
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(2, 2, true, 100, { isEmpty: true })}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });
});
