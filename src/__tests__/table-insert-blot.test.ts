import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQuillWithTableModule } from './utils';

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
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
             <col width="100%" data-full="true" />
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="1" colspan="1">
                  <p>
                    <p><img src="https://live.mdnplay.dev/en-US/docs/Web/HTML/Element/img/favicon144.png" /></p>
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </p>
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
      <p>
        <table cellpadding="0" cellspacing="0" data-full>
          <colgroup>
           <col width="100%" data-full="true" />
          </colgroup>
          <tbody>
            <tr>
              <td rowspan="1" colspan="1">
                <p>
                  <ol>
                    <li data-list="bullet">text</li>
                  </ol>
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </p>
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
      <p>
        <table cellpadding="0" cellspacing="0" data-full>
          <colgroup>
           <col width="100%" data-full="true" />
          </colgroup>
          <tbody>
            <tr>
              <td rowspan="1" colspan="1">
                <p>
                  <h2>text</h2>
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </p>
      <p><br></p>
    `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });
});

describe('insert block embed blot', () => {
  it('insert image', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: 'true', width: 100 } } },
      { insert: { video: 'https://quilljs.com/' } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await vi.runAllTimersAsync();
    // td 中 table-cell-inner 的 p 标签没有识别到开始, 只有结束
    expect(quill.root).toEqualHTML(
      `
      <p><br></p>
      <p>
        <table cellpadding="0" cellspacing="0" data-full>
          <colgroup>
           <col width="100%" data-full="true" />
          </colgroup>
          <tbody>
            <tr>
              <td rowspan="1" colspan="1">
                  <p>
                    <iframe src="https://quilljs.com/" frameborder="0" allowfullscreen="true"></iframe>
                  </p>
                  <p><br></p>
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </p>
      <p><br></p>
    `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan', 'contenteditable'] },
    );
  });
});
