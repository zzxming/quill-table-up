import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQuillWithTableModule, createTableHTML, createTaleColHTML } from './utils';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('cliboard', () => {
  it('cliboard convert table', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({
        html: '<div class="ql-table-wrapper" data-table-id="1"><table class="ql-table" data-table-id="1" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 300px;"><colgroup data-table-id="1" contenteditable="false"><col width="100px" data-table-id="1" data-col-id="1"><col width="100px" data-table-id="1" data-col-id="2"><col width="100px" data-table-id="1" data-col-id="3"></colgroup><tbody data-table-id="1"><tr class="ql-table-row" data-table-id="1" data-row-id="1"><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="1" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="1" data-rowspan="1" data-colspan="1"><p>1</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="2" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="2" data-rowspan="1" data-colspan="1"><p>2</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="3" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="3" data-rowspan="1" data-colspan="1"><p>3</p></div></td></tr><tr class="ql-table-row" data-table-id="1" data-row-id="2"><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="1" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="1" data-rowspan="1" data-colspan="1"><p>4</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="2" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="2" data-rowspan="1" data-colspan="1"><p>5</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="3" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="3" data-rowspan="1" data-colspan="1"><p>6</p></div></td></tr><tr class="ql-table-row" data-table-id="1" data-row-id="3"><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="1" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="1" data-rowspan="1" data-colspan="1"><p>7</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="2" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="2" data-rowspan="1" data-colspan="1"><p>8</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="3" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="3" data-rowspan="1" data-colspan="1"><p>9</p></div></td></tr></tbody></table></div>',
      }),
    );
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(3, 3, { width: 100, full: false }, { isEmpty: false })}
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'contenteditable'] },
    );
  });

  it('cliboard convert simple row merged cell', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({
        html: '<div class="ql-table-wrapper" data-table-id="1"><table class="ql-table" data-table-id="1" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 300px;"><colgroup data-table-id="1" contenteditable="false"><col width="100px" data-table-id="1" data-col-id="1"><col width="100px" data-table-id="1" data-col-id="2"><col width="100px" data-table-id="1" data-col-id="3"></colgroup><tbody data-table-id="1"><tr class="ql-table-row" data-table-id="1" data-row-id="1"><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="1" rowspan="2" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="1" data-rowspan="2" data-colspan="1"><p>1</p><p>4</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="2" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="2" data-rowspan="1" data-colspan="1"><p>2</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="3" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="3" data-rowspan="1" data-colspan="1"><p>3</p></div></td></tr><tr class="ql-table-row" data-table-id="1" data-row-id="2"><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="2" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="2" data-rowspan="1" data-colspan="1"><p>5</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="3" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="3" data-rowspan="1" data-colspan="1"><p>6</p></div></td></tr><tr class="ql-table-row" data-table-id="1" data-row-id="3"><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="1" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="1" data-rowspan="1" data-colspan="1"><p>7</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="2" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="2" data-rowspan="1" data-colspan="1"><p>8</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="3" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="3" data-rowspan="1" data-colspan="1"><p>9</p></div></td></tr></tbody></table></div>',
      }),
    );
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0">
            <colgroup contenteditable="false">
              <col width="100px">
              <col width="100px">
              <col width="100px">
            </colgroup>
            <tbody>
              <tr>
                <td rowspan="2" colspan="1">
                  <div data-rowspan="2" data-colspan="1"><p>1</p><p>4</p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p>2</p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p>3</p></div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p>5</p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p>6</p></div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p>7</p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p>8</p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p>9</p></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'contenteditable'] },
    );
  });

  it('cliboard convert multiple merged cell', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({
        html: '<div class="ql-table-wrapper" data-table-id="20qbgq25yls"><table class="ql-table" data-table-id="20qbgq25yls" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 552px;"><colgroup data-table-id="20qbgq25yls" contenteditable="false"><col width="92px" data-table-id="20qbgq25yls" data-col-id="koogcnquztb"><col width="92px" data-table-id="20qbgq25yls" data-col-id="f79h4ztxj8q"><col width="92px" data-table-id="20qbgq25yls" data-col-id="5gs6eve67e"><col width="92px" data-table-id="20qbgq25yls" data-col-id="4h2hpevrsri"><col width="92px" data-table-id="20qbgq25yls" data-col-id="7oxn7r6w1pt"><col width="92px" data-table-id="20qbgq25yls" data-col-id="gr9shrjb22u"></colgroup><tbody data-table-id="20qbgq25yls"><tr class="ql-table-row" data-table-id="20qbgq25yls" data-row-id="xokhdrqgaep"><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="xokhdrqgaep" data-col-id="koogcnquztb" rowspan="3" colspan="4"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="xokhdrqgaep" data-col-id="koogcnquztb" data-rowspan="3" data-colspan="4"><p><br></p></div></td><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="xokhdrqgaep" data-col-id="7oxn7r6w1pt" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="xokhdrqgaep" data-col-id="7oxn7r6w1pt" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="xokhdrqgaep" data-col-id="gr9shrjb22u" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="xokhdrqgaep" data-col-id="gr9shrjb22u" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="20qbgq25yls" data-row-id="3jm31cjuty2"><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="3jm31cjuty2" data-col-id="7oxn7r6w1pt" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="3jm31cjuty2" data-col-id="7oxn7r6w1pt" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="3jm31cjuty2" data-col-id="gr9shrjb22u" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="3jm31cjuty2" data-col-id="gr9shrjb22u" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="20qbgq25yls" data-row-id="upc6c7so57s"><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="upc6c7so57s" data-col-id="7oxn7r6w1pt" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="upc6c7so57s" data-col-id="7oxn7r6w1pt" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="upc6c7so57s" data-col-id="gr9shrjb22u" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="upc6c7so57s" data-col-id="gr9shrjb22u" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="20qbgq25yls" data-row-id="tbdchag52d"><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="tbdchag52d" data-col-id="koogcnquztb" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="tbdchag52d" data-col-id="koogcnquztb" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="tbdchag52d" data-col-id="f79h4ztxj8q" rowspan="2" colspan="4"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="tbdchag52d" data-col-id="f79h4ztxj8q" data-rowspan="2" data-colspan="4"><p><br></p></div></td><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="tbdchag52d" data-col-id="gr9shrjb22u" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="tbdchag52d" data-col-id="gr9shrjb22u" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="20qbgq25yls" data-row-id="8w13n0houz4"><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="8w13n0houz4" data-col-id="koogcnquztb" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="8w13n0houz4" data-col-id="koogcnquztb" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="8w13n0houz4" data-col-id="gr9shrjb22u" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="8w13n0houz4" data-col-id="gr9shrjb22u" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb"><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb" data-col-id="koogcnquztb" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb" data-col-id="koogcnquztb" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb" data-col-id="f79h4ztxj8q" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb" data-col-id="f79h4ztxj8q" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb" data-col-id="5gs6eve67e" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb" data-col-id="5gs6eve67e" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb" data-col-id="4h2hpevrsri" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb" data-col-id="4h2hpevrsri" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb" data-col-id="7oxn7r6w1pt" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb" data-col-id="7oxn7r6w1pt" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb" data-col-id="gr9shrjb22u" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="20qbgq25yls" data-row-id="wtadizd3fdb" data-col-id="gr9shrjb22u" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr></tbody></table></div>',
      }),
    );
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0">
            ${createTaleColHTML(6, { width: 92, full: false })}
            <tbody>
              <tr>
                <td rowspan="3" colspan="4">
                  <div data-rowspan="3" data-colspan="4"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="2" colspan="4">
                  <div data-rowspan="2" data-colspan="4"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'contenteditable'] },
    );
  });
});
