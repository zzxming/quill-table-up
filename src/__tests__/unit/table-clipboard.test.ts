import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQuillWithTableModule, createTableDeltaOps, createTableHTML, createTaleColHTML } from './utils';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('clipboard cell structure', () => {
  it('clipboard convert table', async () => {
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
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'contenteditable'] },
    );
  });

  it('clipboard convert simple row merged cell', async () => {
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
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'contenteditable'] },
    );
  });

  it('clipboard convert multiple merged cell', async () => {
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
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'contenteditable'] },
    );
  });

  it('clipboard convert multiple merged cell 2', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({
        html: '<div class="ql-table-wrapper" data-table-id="jtgjjhsazan"><table class="ql-table" data-table-id="jtgjjhsazan" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 1015px;"><colgroup data-table-id="jtgjjhsazan" contenteditable="false"><col width="145px" data-table-id="jtgjjhsazan" data-col-id="lcqe1oszz2d"><col width="145px" data-table-id="jtgjjhsazan" data-col-id="3gexyky3l85"><col width="145px" data-table-id="jtgjjhsazan" data-col-id="u4mwvxbsbbe"><col width="145px" data-table-id="jtgjjhsazan" data-col-id="ut2zlf9nhmn"><col width="145px" data-table-id="jtgjjhsazan" data-col-id="1b9m3f8tz77"><col width="145px" data-table-id="jtgjjhsazan" data-col-id="yt3fiis74wf"><col width="145px" data-table-id="jtgjjhsazan" data-col-id="2n9x1ugvy1p"></colgroup><tbody data-table-id="jtgjjhsazan"><tr class="ql-table-row" data-table-id="jtgjjhsazan" data-row-id="jbrlyb47l4"><td class="ql-table-cell" data-table-id="jtgjjhsazan" data-row-id="jbrlyb47l4" data-col-id="lcqe1oszz2d" rowspan="2" colspan="3"><div class="ql-table-cell-inner" data-table-id="jtgjjhsazan" data-row-id="jbrlyb47l4" data-col-id="lcqe1oszz2d" data-rowspan="2" data-colspan="3"><p><br></p></div></td><td class="ql-table-cell" data-table-id="jtgjjhsazan" data-row-id="jbrlyb47l4" data-col-id="ut2zlf9nhmn" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="jtgjjhsazan" data-row-id="jbrlyb47l4" data-col-id="ut2zlf9nhmn" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="jtgjjhsazan" data-row-id="jbrlyb47l4" data-col-id="1b9m3f8tz77" rowspan="2" colspan="3"><div class="ql-table-cell-inner" data-table-id="jtgjjhsazan" data-row-id="jbrlyb47l4" data-col-id="1b9m3f8tz77" data-rowspan="2" data-colspan="3"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="jtgjjhsazan" data-row-id="s2x86miz6ke"><td class="ql-table-cell" data-table-id="jtgjjhsazan" data-row-id="s2x86miz6ke" data-col-id="ut2zlf9nhmn" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="jtgjjhsazan" data-row-id="s2x86miz6ke" data-col-id="ut2zlf9nhmn" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8"><td class="ql-table-cell" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="lcqe1oszz2d" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="lcqe1oszz2d" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="3gexyky3l85" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="3gexyky3l85" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="u4mwvxbsbbe" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="u4mwvxbsbbe" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="ut2zlf9nhmn" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="ut2zlf9nhmn" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="1b9m3f8tz77" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="1b9m3f8tz77" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="yt3fiis74wf" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="yt3fiis74wf" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="2n9x1ugvy1p" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="jtgjjhsazan" data-row-id="seartuzbg8" data-col-id="2n9x1ugvy1p" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr></tbody></table></div>',
      }),
    );
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0">
            ${createTaleColHTML(7, { width: 145, full: false })}
            <tbody>
              <tr>
                <td rowspan="2" colspan="3">
                  <div data-rowspan="2" data-colspan="3"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="2" colspan="3">
                  <div data-rowspan="2" data-colspan="3"><p><br></p></div>
                </td>
              </tr>
              <tr>
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
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'contenteditable'] },
    );
  });

  it('clipboard convert table without new line', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({
        html: '<p>123</p><div class="ql-table-wrapper" data-table-id="1"><table class="ql-table" data-table-id="1" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 300px;"><colgroup data-table-id="1" contenteditable="false"><col width="100px" data-table-id="1" data-col-id="1"><col width="100px" data-table-id="1" data-col-id="2"><col width="100px" data-table-id="1" data-col-id="3"></colgroup><tbody data-table-id="1"><tr class="ql-table-row" data-table-id="1" data-row-id="1"><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="1" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="1" data-rowspan="1" data-colspan="1"><p>1</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="2" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="2" data-rowspan="1" data-colspan="1"><p>2</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="1" data-col-id="3" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="1" data-col-id="3" data-rowspan="1" data-colspan="1"><p>3</p></div></td></tr><tr class="ql-table-row" data-table-id="1" data-row-id="2"><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="1" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="1" data-rowspan="1" data-colspan="1"><p>4</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="2" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="2" data-rowspan="1" data-colspan="1"><p>5</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="2" data-col-id="3" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="2" data-col-id="3" data-rowspan="1" data-colspan="1"><p>6</p></div></td></tr><tr class="ql-table-row" data-table-id="1" data-row-id="3"><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="1" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="1" data-rowspan="1" data-colspan="1"><p>7</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="2" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="2" data-rowspan="1" data-colspan="1"><p>8</p></div></td><td class="ql-table-cell" data-table-id="1" data-row-id="3" data-col-id="3" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="1" data-row-id="3" data-col-id="3" data-rowspan="1" data-colspan="1"><p>9</p></div></td></tr></tbody></table></div><p>123</p>',
      }),
    );
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p>123</p>
        ${createTableHTML(3, 3, { width: 100, full: false }, { isEmpty: false })}
        <p>123</p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'contenteditable'] },
    );
  });
});

describe('clipboard content format', () => {
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

  it('should convert html blockquote correctly', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(quill.clipboard.convert({
      html: '<div class="ql-table-wrapper" data-table-id="8rqhkks1osv"><table class="ql-table" data-table-id="8rqhkks1osv" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 1166px;"><colgroup data-table-id="8rqhkks1osv" contenteditable="false"><col width="583px" data-table-id="8rqhkks1osv" data-col-id="b947km1o14"><col width="583px" data-table-id="8rqhkks1osv" data-col-id="wo2geakh0g"></colgroup><tbody data-table-id="8rqhkks1osv"><tr class="ql-table-row" data-table-id="8rqhkks1osv" data-row-id="vx0l7y3du9f"><td class="ql-table-cell" data-table-id="8rqhkks1osv" data-row-id="vx0l7y3du9f" data-col-id="b947km1o14" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="8rqhkks1osv" data-row-id="vx0l7y3du9f" data-col-id="b947km1o14" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="8rqhkks1osv" data-row-id="vx0l7y3du9f" data-col-id="wo2geakh0g" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="8rqhkks1osv" data-row-id="vx0l7y3du9f" data-col-id="wo2geakh0g" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="8rqhkks1osv" data-row-id="udrwd720bo"><td class="ql-table-cell" data-table-id="8rqhkks1osv" data-row-id="udrwd720bo" data-col-id="b947km1o14" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="8rqhkks1osv" data-row-id="udrwd720bo" data-col-id="b947km1o14" data-rowspan="1" data-colspan="1"><p><br></p><blockquote>blockquote</blockquote><blockquote><br></blockquote></div></td><td class="ql-table-cell" data-table-id="8rqhkks1osv" data-row-id="udrwd720bo" data-col-id="wo2geakh0g" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="8rqhkks1osv" data-row-id="udrwd720bo" data-col-id="wo2geakh0g" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr></tbody></table></div>',
    }));
    await vi.runAllTimersAsync();

    const ops = quill.getContents().ops;
    const resultOps = [
      { insert: '\n' },
      { insert: { 'table-up-col': { full: false, width: 583 } } },
      { insert: { 'table-up-col': { full: false, width: 583 } } },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: 'blockquote' },
      { attributes: { 'blockquote': true, 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n\n' },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ];
    for (const [i, op] of ops.entries()) {
      expect(op).toMatchObject(resultOps[i]);
    }
  });

  it('clipboard convert cell with block format html', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(
      quill.clipboard.convert({
        html: '<div class="ql-table-wrapper" data-table-id="9jypy709wki"><table class="ql-table" data-table-id="9jypy709wki" cellpadding="0" cellspacing="0" style="margin-right: auto; width: 1165px;"><colgroup data-table-id="9jypy709wki" contenteditable="false"><col width="233px" data-table-id="9jypy709wki" data-col-id="jsvukntxx7c"><col width="233px" data-table-id="9jypy709wki" data-col-id="esm3ms8zxic"><col width="233px" data-table-id="9jypy709wki" data-col-id="wwbiyp73ajj"><col width="233px" data-table-id="9jypy709wki" data-col-id="bg5s13lbsi"><col width="233px" data-table-id="9jypy709wki" data-col-id="bvwn2fw55xs"></colgroup><tbody data-table-id="9jypy709wki"><tr class="ql-table-row" data-table-id="9jypy709wki" data-row-id="xxuv456bqr"><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="xxuv456bqr" data-col-id="jsvukntxx7c" rowspan="3" colspan="2"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="xxuv456bqr" data-col-id="jsvukntxx7c" data-rowspan="3" data-colspan="2"><p><br></p><div class="ql-code-block-container" spellcheck="false"><div class="ql-code-block" data-language="plain">qweqwe</div><div class="ql-code-block" data-language="plain">123123</div></div></div></td><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="xxuv456bqr" data-col-id="wwbiyp73ajj" rowspan="1" colspan="3"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="xxuv456bqr" data-col-id="wwbiyp73ajj" data-rowspan="1" data-colspan="3"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="9jypy709wki" data-row-id="oke9hba31p"><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="oke9hba31p" data-col-id="wwbiyp73ajj" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="oke9hba31p" data-col-id="wwbiyp73ajj" data-rowspan="1" data-colspan="1"><h1>12345</h1><p>blank</p><h1>qwert</h1></div></td><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="oke9hba31p" data-col-id="bg5s13lbsi" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="oke9hba31p" data-col-id="bg5s13lbsi" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="oke9hba31p" data-col-id="bvwn2fw55xs" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="oke9hba31p" data-col-id="bvwn2fw55xs" data-rowspan="1" data-colspan="1"><ol><li data-list="unchecked"><span class="ql-ui" contenteditable="false"></span>check</li><li data-list="checked"><span class="ql-ui" contenteditable="false"></span>checked</li></ol></div></td></tr><tr class="ql-table-row" data-table-id="9jypy709wki" data-row-id="syesyrm0dyj"><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="syesyrm0dyj" data-col-id="wwbiyp73ajj" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="syesyrm0dyj" data-col-id="wwbiyp73ajj" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="syesyrm0dyj" data-col-id="bg5s13lbsi" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="syesyrm0dyj" data-col-id="bg5s13lbsi" data-rowspan="1" data-colspan="1"><ol><li data-list="ordered"><span class="ql-ui" contenteditable="false"></span>list</li><li data-list="ordered"><span class="ql-ui" contenteditable="false"></span>list</li></ol></div></td><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="syesyrm0dyj" data-col-id="bvwn2fw55xs" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="syesyrm0dyj" data-col-id="bvwn2fw55xs" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr><tr class="ql-table-row" data-table-id="9jypy709wki" data-row-id="46snirypksr"><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="46snirypksr" data-col-id="jsvukntxx7c" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="46snirypksr" data-col-id="jsvukntxx7c" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="46snirypksr" data-col-id="esm3ms8zxic" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="46snirypksr" data-col-id="esm3ms8zxic" data-rowspan="1" data-colspan="1"><blockquote>qoute</blockquote><blockquote><br></blockquote></div></td><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="46snirypksr" data-col-id="wwbiyp73ajj" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="46snirypksr" data-col-id="wwbiyp73ajj" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="46snirypksr" data-col-id="bg5s13lbsi" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="46snirypksr" data-col-id="bg5s13lbsi" data-rowspan="1" data-colspan="1"><p><br></p></div></td><td class="ql-table-cell" data-table-id="9jypy709wki" data-row-id="46snirypksr" data-col-id="bvwn2fw55xs" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="9jypy709wki" data-row-id="46snirypksr" data-col-id="bvwn2fw55xs" data-rowspan="1" data-colspan="1"><p><br></p></div></td></tr></tbody></table></div>',
      }),
    );
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0">
            ${createTaleColHTML(5, { width: 233, full: false })}
            <tbody>
              <tr>
                <td rowspan="3" colspan="2">
                  <div data-rowspan="3" data-colspan="2">
                    <p><br></p>
                    <div spellcheck="false">
                      <div data-language="plain">qweqwe</div>
                      <div data-language="plain">123123</div>
                    </div>
                  </div>
                </td>
                <td rowspan="1" colspan="3">
                  <div data-rowspan="1" data-colspan="3"><p><br></p></div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1">
                    <h1>12345</h1>
                    <p>blank</p>
                    <h1>qwert</h1>
                  </div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1">
                    <ol>
                      <li data-list="unchecked">check</li>
                      <li data-list="checked">checked</li>
                    </ol>
                  </div>
                </td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1"><p><br></p></div>
                </td>
                <td rowspan="1" colspan="1">
                  <div data-rowspan="1" data-colspan="1">
                    <ol>
                      <li data-list="ordered">list</li>
                      <li data-list="ordered">list</li>
                    </ol>
                  </div>
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
                  <div data-rowspan="1" data-colspan="1">
                    <blockquote>qoute</blockquote>
                    <blockquote><br></blockquote>
                  </div>
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
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'contenteditable'] },
    );
  });
});

describe('clipboard cell in cell', () => {
  it('paste simple text into table', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(createTableDeltaOps(1, 1, { full: false, width: 100 }, { isEmpty: true }));
    await vi.runAllTimersAsync();
    const range = { index: 2, length: 0 };
    quill.setSelection(range);
    quill.clipboard.onPaste(
      range,
      { html: '<html>\r\n<body>\r\n\u003C!--StartFragment--><p>text</p><p>123</p>\u003C!--EndFragment-->\r\n</body>\r\n</html>' },
    );
    await vi.runAllTimersAsync();
    const ops = quill.getContents().ops;
    const resultOps = [
      { insert: '\n' },
      { insert: { 'table-up-col': { full: false, width: 100 } } },
      { insert: 'text' },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '123' },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n\n' },
      { insert: '\n' },
    ];
    for (const [i, op] of ops.entries()) {
      expect(op).toMatchObject(resultOps[i]);
    }
  });

  it('paste format text into table', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(createTableDeltaOps(1, 1, { full: false, width: 100 }, { isEmpty: true }));
    await vi.runAllTimersAsync();
    const range = { index: 2, length: 0 };
    quill.setSelection(range);
    quill.clipboard.onPaste(
      range,
      { html: '<html>\r\n<body>\r\n\u003C!--StartFragment--><h1>123</h1><p></p><p><strong style="color: rgb(230, 0, 0); background-color: rgb(0, 0, 0);"><em><s><u>123</u></s></em></strong><sub style="color: rgb(230, 0, 0); background-color: rgb(0, 0, 0);"><strong><em><s><u>qwe</u></s></em></strong></sub></p>\u003C!--EndFragment-->\r\n</body>\r\n</html>' },
    );
    await vi.runAllTimersAsync();
    const ops = quill.getContents().ops;
    const resultOps = [
      { insert: '\n' },
      { insert: { 'table-up-col': { full: false, width: 100 } } },
      { insert: '123' },
      { attributes: { 'header': 1, 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { background: '#000000', color: '#e60000' }, insert: '123' },
      { attributes: { background: '#000000', color: '#e60000', script: 'sub' }, insert: 'qwe' },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n\n' },
      { insert: '\n' },
    ];
    for (const [i, op] of ops.entries()) {
      expect(op).toMatchObject(resultOps[i]);
    }
  });

  it('paste cell text into table', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(createTableDeltaOps(1, 1, { full: false, width: 100 }, { isEmpty: true }));
    await vi.runAllTimersAsync();
    const range = { index: 2, length: 0 };
    quill.setSelection(range);
    quill.clipboard.onPaste(
      range,
      { html: '<html>\r\n<body>\r\n\u003C!--StartFragment--><div class="ql-table-wrapper" data-table-id="8v36875pbr6"><table class="ql-table" data-table-id="8v36875pbr6" data-full="true" cellpadding="0" cellspacing="0" style="margin-right: auto;"><tbody data-table-id="8v36875pbr6"><tr class="ql-table-row" data-table-id="8v36875pbr6" data-row-id="zjhlbpvwjo"><td class="ql-table-cell" data-table-id="8v36875pbr6" data-row-id="zjhlbpvwjo" data-col-id="y0epsy6odnm" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="8v36875pbr6" data-row-id="zjhlbpvwjo" data-col-id="y0epsy6odnm" data-rowspan="1" data-colspan="1"><p>5</p><p></p><p>q</p></div></td></tr></tbody></table></div>\u003C!--EndFragment-->\r\n</body>\r\n</html>' },
    );
    await vi.runAllTimersAsync();
    const ops = quill.getContents().ops;
    const resultOps = [
      { insert: '\n' },
      { insert: { 'table-up-col': { full: false, width: 100 } } },
      { insert: '5' },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n\n' },
      { insert: 'q' },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n\n' },
      { insert: '\n' },
    ];
    for (const [i, op] of ops.entries()) {
      expect(op).toMatchObject(resultOps[i]);
    }
  });

  it('paste cell with format text into table', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents(createTableDeltaOps(1, 1, { full: false, width: 100 }, { isEmpty: true }));
    await vi.runAllTimersAsync();
    const range = { index: 2, length: 0 };
    quill.setSelection(range);
    quill.clipboard.onPaste(
      range,
      { html: '<html>\r\n<body>\r\n\u003C!--StartFragment--><div class="ql-table-wrapper" data-table-id="8v36875pbr6"><table class="ql-table" data-table-id="8v36875pbr6" data-full="true" cellpadding="0" cellspacing="0" style="margin-right: auto;"><tbody data-table-id="8v36875pbr6"><tr class="ql-table-row" data-table-id="8v36875pbr6" data-row-id="zjhlbpvwjo"><td class="ql-table-cell" data-table-id="8v36875pbr6" data-row-id="zjhlbpvwjo" data-col-id="gpais2dyp87" rowspan="1" colspan="1"><div class="ql-table-cell-inner" data-table-id="8v36875pbr6" data-row-id="zjhlbpvwjo" data-col-id="gpais2dyp87" data-rowspan="1" data-colspan="1"><h1>123</h1><p></p><p><strong><em><s><u>123</u></s></em></strong><sub><strong><em><s><u>qwe</u></s></em></strong></sub><sup><strong><em><s><u>qwe</u></s></em></strong></sup></p></div></td></tr></tbody></table></div>\u003C!--EndFragment-->\r\n</body>\r\n</html>' },
    );
    await vi.runAllTimersAsync();
    const ops = quill.getContents().ops;
    const resultOps = [
      { insert: '\n' },
      { insert: { 'table-up-col': { full: false, width: 100 } } },
      { insert: '123' },
      { attributes: { 'header': 1, 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { underline: true, strike: true, italic: true, bold: true }, insert: '123' },
      { attributes: { underline: true, strike: true, italic: true, bold: true, script: 'sub' }, insert: 'qwe' },
      { attributes: { underline: true, strike: true, italic: true, bold: true, script: 'super' }, insert: 'qwe' },
      { attributes: { 'table-up-cell-inner': { rowspan: 1, colspan: 1 } }, insert: '\n\n' },
      { insert: '\n' },
    ];
    for (const [i, op] of ops.entries()) {
      expect(op).toMatchObject(resultOps[i]);
    }
  });
});
