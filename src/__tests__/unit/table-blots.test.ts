import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TableCellFormat } from '../../formats';
import { TableUp } from '../../table-up';
import { createQuillWithTableModule } from './utils';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('test tableCell getNearByCell', () => {
  it('getNearByCell left', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    tableModule.insertTable(3, 3);
    await vi.runAllTimersAsync();
    const tds = quill.scroll.descendants(TableCellFormat, 0);
    expect(tds[4].getNearByCell('left')).toEqual([tds[3]]);
  });

  it('getNearByCell left (before cell have merge cell)', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: 'vv2xmonkcdq', colId: 'yyzprl5nm6a', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: 'vv2xmonkcdq', colId: 'rbxstjgmt1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: 'vv2xmonkcdq', colId: 'wiy1z7o6r8', full: false, width: 100 } } },
      { attributes: { 'table-up-cell-inner': { tableId: 'vv2xmonkcdq', rowId: 'dfvd9tlo86d', colId: 'yyzprl5nm6a', rowspan: 2, colspan: 2 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'vv2xmonkcdq', rowId: 'dfvd9tlo86d', colId: 'wiy1z7o6r8', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'vv2xmonkcdq', rowId: 'cp2te48tbi', colId: 'wiy1z7o6r8', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'vv2xmonkcdq', rowId: 'y9c5spa0rj', colId: 'yyzprl5nm6a', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'vv2xmonkcdq', rowId: 'y9c5spa0rj', colId: 'rbxstjgmt1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'vv2xmonkcdq', rowId: 'y9c5spa0rj', colId: 'wiy1z7o6r8', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await vi.runAllTimersAsync();
    const tds1 = quill.scroll.descendants(TableCellFormat, 0);
    expect(tds1[1].getNearByCell('left')).toEqual([tds1[0]]);
    expect(tds1[2].getNearByCell('left')).toEqual([]);
    expect(tds1[5].getNearByCell('left')).toEqual([tds1[4]]);

    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: 'p0a2x1lw2rk', colId: '4coaaxs1bka', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: 'p0a2x1lw2rk', colId: '6q7c4xg24ht', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: 'p0a2x1lw2rk', colId: 'yqycicys6cq', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: 'p0a2x1lw2rk', colId: '4gtetquckd5', full: false, width: 100 } } },
      { attributes: { 'table-up-cell-inner': { tableId: 'p0a2x1lw2rk', rowId: 'imqhpv9xmu', colId: '4coaaxs1bka', rowspan: 1, colspan: 2 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'p0a2x1lw2rk', rowId: 'imqhpv9xmu', colId: 'yqycicys6cq', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'p0a2x1lw2rk', rowId: 'imqhpv9xmu', colId: '4gtetquckd5', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'p0a2x1lw2rk', rowId: '4wygeorbfdf', colId: '4coaaxs1bka', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'p0a2x1lw2rk', rowId: '4wygeorbfdf', colId: '6q7c4xg24ht', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'p0a2x1lw2rk', rowId: '4wygeorbfdf', colId: 'yqycicys6cq', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'p0a2x1lw2rk', rowId: '4wygeorbfdf', colId: '4gtetquckd5', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'p0a2x1lw2rk', rowId: '01iyk867h9sj', colId: '4coaaxs1bka', rowspan: 2, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'p0a2x1lw2rk', rowId: '01iyk867h9sj', colId: '6q7c4xg24ht', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'p0a2x1lw2rk', rowId: '01iyk867h9sj', colId: 'yqycicys6cq', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'p0a2x1lw2rk', rowId: '01iyk867h9sj', colId: '4gtetquckd5', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'p0a2x1lw2rk', rowId: 'wsbuoh24w4', colId: '6q7c4xg24ht', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'p0a2x1lw2rk', rowId: 'wsbuoh24w4', colId: 'yqycicys6cq', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'p0a2x1lw2rk', rowId: 'wsbuoh24w4', colId: '4gtetquckd5', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await vi.runAllTimersAsync();
    const tds2 = quill.scroll.descendants(TableCellFormat, 0);
    expect(tds2[2].getNearByCell('left')).toEqual([tds2[1]]);
    expect(tds2[9].getNearByCell('left')).toEqual([tds2[8]]);
    expect(tds2[13].getNearByCell('left')).toEqual([tds2[12]]);
  });

  it('getNearByCell left (current merge cell)', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: 'nhvnk5kj1ae', colId: '147glanhu4', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: 'nhvnk5kj1ae', colId: '5gi4xubff5n', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: 'nhvnk5kj1ae', colId: 'q2susi91kv', full: false, width: 100 } } },
      { attributes: { 'table-up-cell-inner': { tableId: 'nhvnk5kj1ae', rowId: 'uxj0buah8p', colId: '147glanhu4', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'nhvnk5kj1ae', rowId: 'uxj0buah8p', colId: '5gi4xubff5n', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'nhvnk5kj1ae', rowId: 'uxj0buah8p', colId: 'q2susi91kv', rowspan: 3, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'nhvnk5kj1ae', rowId: '07jgi0d0hhf', colId: '147glanhu4', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'nhvnk5kj1ae', rowId: '07jgi0d0hhf', colId: '5gi4xubff5n', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'nhvnk5kj1ae', rowId: 'fdamb6hr8bt', colId: '147glanhu4', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'nhvnk5kj1ae', rowId: 'fdamb6hr8bt', colId: '5gi4xubff5n', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await vi.runAllTimersAsync();
    const tds = quill.scroll.descendants(TableCellFormat, 0);
    expect(tds[2].getNearByCell('left')).toEqual([tds[1], tds[4], tds[6]]);
  });

  it('getNearByCell left (current merge cell and before have merge cell)', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: 'd6nxgcr2nsd', colId: '1rvvyleo0ee', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: 'd6nxgcr2nsd', colId: '3jvqzgjzvc3', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: 'd6nxgcr2nsd', colId: 'e9qn1b3zhto', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: 'd6nxgcr2nsd', colId: 'iwktteaq5p', full: false, width: 100 } } },
      { attributes: { 'table-up-cell-inner': { tableId: 'd6nxgcr2nsd', rowId: 'vhjv6xkdo8e', colId: '1rvvyleo0ee', rowspan: 1, colspan: 3 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'd6nxgcr2nsd', rowId: 'vhjv6xkdo8e', colId: 'iwktteaq5p', rowspan: 3, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'd6nxgcr2nsd', rowId: '33922uw827e', colId: '1rvvyleo0ee', rowspan: 2, colspan: 2 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'd6nxgcr2nsd', rowId: '33922uw827e', colId: 'e9qn1b3zhto', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'd6nxgcr2nsd', rowId: '0wyvy9e7zq8', colId: 'e9qn1b3zhto', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'd6nxgcr2nsd', rowId: 'zvmle5uwesp', colId: '1rvvyleo0ee', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'd6nxgcr2nsd', rowId: 'zvmle5uwesp', colId: '3jvqzgjzvc3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'd6nxgcr2nsd', rowId: 'zvmle5uwesp', colId: 'e9qn1b3zhto', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'd6nxgcr2nsd', rowId: 'zvmle5uwesp', colId: 'iwktteaq5p', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await vi.runAllTimersAsync();
    const tds = quill.scroll.descendants(TableCellFormat, 0);
    expect(tds[1].getNearByCell('left')).toEqual([tds[0], tds[3], tds[4]]);
  });

  it('getNearByCell top', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    tableModule.insertTable(3, 3);
    await vi.runAllTimersAsync();
    const tds = quill.scroll.descendants(TableCellFormat, 0);
    expect(tds[4].getNearByCell('top')).toEqual([tds[1]]);
  });

  it('getNearByCell top (before cell have merge cell)', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: 'vv2xmonkcdq', colId: 'yyzprl5nm6a', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: 'vv2xmonkcdq', colId: 'rbxstjgmt1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: 'vv2xmonkcdq', colId: 'wiy1z7o6r8', full: false, width: 100 } } },
      { attributes: { 'table-up-cell-inner': { tableId: 'vv2xmonkcdq', rowId: 'dfvd9tlo86d', colId: 'yyzprl5nm6a', rowspan: 2, colspan: 2 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'vv2xmonkcdq', rowId: 'dfvd9tlo86d', colId: 'wiy1z7o6r8', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'vv2xmonkcdq', rowId: 'cp2te48tbi', colId: 'wiy1z7o6r8', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'vv2xmonkcdq', rowId: 'y9c5spa0rj', colId: 'yyzprl5nm6a', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'vv2xmonkcdq', rowId: 'y9c5spa0rj', colId: 'rbxstjgmt1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: 'vv2xmonkcdq', rowId: 'y9c5spa0rj', colId: 'wiy1z7o6r8', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await vi.runAllTimersAsync();
    const tds1 = quill.scroll.descendants(TableCellFormat, 0);
    expect(tds1[3].getNearByCell('top')).toEqual([tds1[0]]);
    expect(tds1[4].getNearByCell('top')).toEqual([]);
    expect(tds1[5].getNearByCell('top')).toEqual([tds1[2]]);

    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '30jgnjw9n9w', colId: '00jo66o6uwlk', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '30jgnjw9n9w', colId: 'ks1njmku5oe', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '30jgnjw9n9w', colId: 'u2zqw9rwkxd', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '30jgnjw9n9w', colId: 'jgw4vh5knc', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '30jgnjw9n9w', colId: 'tyrw6mifzq', full: false, width: 100 } } },
      { attributes: { 'table-up-cell-inner': { tableId: '30jgnjw9n9w', rowId: 'vzf07egv1br', colId: '00jo66o6uwlk', rowspan: 2, colspan: 2 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '30jgnjw9n9w', rowId: 'vzf07egv1br', colId: 'u2zqw9rwkxd', rowspan: 3, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '30jgnjw9n9w', rowId: 'vzf07egv1br', colId: 'jgw4vh5knc', rowspan: 1, colspan: 2 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '30jgnjw9n9w', rowId: '8mdx3y6lp1h', colId: 'jgw4vh5knc', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '30jgnjw9n9w', rowId: '8mdx3y6lp1h', colId: 'tyrw6mifzq', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '30jgnjw9n9w', rowId: '2dwhizp7ji', colId: '00jo66o6uwlk', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '30jgnjw9n9w', rowId: '2dwhizp7ji', colId: 'ks1njmku5oe', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '30jgnjw9n9w', rowId: '2dwhizp7ji', colId: 'jgw4vh5knc', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '30jgnjw9n9w', rowId: '2dwhizp7ji', colId: 'tyrw6mifzq', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '30jgnjw9n9w', rowId: 'su9l1e8rmfc', colId: '00jo66o6uwlk', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '30jgnjw9n9w', rowId: 'su9l1e8rmfc', colId: 'ks1njmku5oe', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '30jgnjw9n9w', rowId: 'su9l1e8rmfc', colId: 'u2zqw9rwkxd', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '30jgnjw9n9w', rowId: 'su9l1e8rmfc', colId: 'jgw4vh5knc', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '30jgnjw9n9w', rowId: 'su9l1e8rmfc', colId: 'tyrw6mifzq', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await vi.runAllTimersAsync();
    const tds2 = quill.scroll.descendants(TableCellFormat, 0);
    expect(tds2[3].getNearByCell('top')).toEqual([tds2[2]]);
    expect(tds2[4].getNearByCell('top')).toEqual([]);
    expect(tds2[5].getNearByCell('top')).toEqual([tds2[0]]);
    expect(tds2[6].getNearByCell('top')).toEqual([]);
    expect(tds2[7].getNearByCell('top')).toEqual([tds2[3]]);
    expect(tds2[8].getNearByCell('top')).toEqual([tds2[4]]);
    expect(tds2[11].getNearByCell('top')).toEqual([tds2[1]]);
  });

  it('getNearByCell top (current merge cell)', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '1', colId: '1', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '2', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '1', colId: '3', full: false, width: 100 } } },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 2, colspan: 2 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await vi.runAllTimersAsync();
    const tds = quill.scroll.descendants(TableCellFormat, 0);
    expect(tds[4].getNearByCell('top')).toEqual([tds[1], tds[2]]);
  });

  it('getNearByCell top (current merge cell and before have merge cell)', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`);
    quill.setContents([
      { insert: '\n' },
      { insert: { 'table-up-col': { tableId: '8v36875pbr6', colId: '1vwhsx9zayhi', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '8v36875pbr6', colId: 'gpais2dyp87', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '8v36875pbr6', colId: 'xtfguzk629', full: false, width: 100 } } },
      { insert: { 'table-up-col': { tableId: '8v36875pbr6', colId: 'y0epsy6odnm', full: false, width: 100 } } },
      { attributes: { 'table-up-cell-inner': { tableId: '8v36875pbr6', rowId: 'zjhlbpvwjo', colId: '1vwhsx9zayhi', rowspan: 2, colspan: 2 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '8v36875pbr6', rowId: 'zjhlbpvwjo', colId: 'xtfguzk629', rowspan: 1, colspan: 2 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '8v36875pbr6', rowId: '9vw214waitk', colId: 'xtfguzk629', rowspan: 2, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '8v36875pbr6', rowId: '9vw214waitk', colId: 'y0epsy6odnm', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '8v36875pbr6', rowId: 'j4uarvyr86d', colId: '1vwhsx9zayhi', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '8v36875pbr6', rowId: 'j4uarvyr86d', colId: 'gpais2dyp87', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { attributes: { 'table-up-cell-inner': { tableId: '8v36875pbr6', rowId: 'j4uarvyr86d', colId: 'y0epsy6odnm', rowspan: 1, colspan: 1 } }, insert: '\n' },
      { insert: '\n' },
    ]);
    await vi.runAllTimersAsync();
    const tds = quill.scroll.descendants(TableCellFormat, 0);
    expect(tds[2].getNearByCell('top')).toEqual([tds[1]]);
  });
});
