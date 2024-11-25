import Quill from 'quill';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TableUp, { updateTableConstants } from '..';

import { TableBodyFormat, TableCellFormat, TableCellInnerFormat, TableColFormat, TableMainFormat, TableRowFormat, TableWrapperFormat } from '../formats';
import { TableSelection } from '../modules';
import { blotName, findParentBlot, findParentBlots } from '../utils';
import { createTable, createTableHTML, createTaleColHTML, normalizeHTML } from './utils';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

const createOverridesTable = (html: string, options = true, moduleOptions = {}, register = {}) => {
  updateTableConstants({
    blotName: {
      tableCol: 'a-col',
      tableCellInner: 'a-cell-inner',
    },
  });
  class TableColFormatOverride extends TableColFormat {
    static create(value: any) {
      const { width, tableId, colId, column, full } = value;
      const node = super.create(value) as HTMLElement;
      node.setAttribute('width', `${Number.parseFloat(width)}${full ? '%' : 'px'}`);
      full && (node.dataset.full = String(full));
      node.dataset.tableId = tableId;
      node.dataset.colId = colId || column;
      node.setAttribute('contenteditable', 'false');
      return node;
    }

    static value(domNode: HTMLElement) {
      const { tableId, colId } = domNode.dataset;
      const width = domNode.getAttribute('width');
      const full = Object.hasOwn(domNode.dataset, 'full');
      const value: Record<string, any> = {
        tableId,
        column: colId,
        full,
      };
      width && (value.width = Number.parseFloat(width));
      return value;
    }
  }
  class TableCellInnerFormatOverride extends TableCellInnerFormat {
    static create(value: any) {
      let { tableId, rowId, colId, row, cell, rowspan, colspan, backgroundColor, height } = value;
      rowId = rowId || row;
      colId = colId || cell;
      const node = super.create(value) as HTMLElement;
      node.dataset.tableId = tableId;
      node.dataset.rowId = rowId;
      node.dataset.colId = colId;
      node.dataset.rowspan = String(rowspan || 1);
      node.dataset.colspan = String(colspan || 1);
      height && (node.dataset.height = height);
      backgroundColor && (node.dataset.backgroundColor = backgroundColor);
      return node;
    }

    formats(): Record<string, any> {
      const { tableId, rowId, colId, rowspan, colspan, backgroundColor, height } = this;
      const value: Record<string, any> = {
        tableId,
        row: rowId,
        cell: colId,
        rowspan,
        colspan,
      };
      height && (value.height = height);
      backgroundColor && (value.backgroundColor = backgroundColor);
      return {
        [this.statics.blotName]: value,
      };
    }
  }
  class TableUpOverride extends TableUp {
    static register(): void {
      super.register();
      Quill.register({
        'formats/a-col': TableColFormatOverride,
        'formats/a-cell-inner': TableCellInnerFormatOverride,
      }, true);
    }
  }
  Quill.register({
    'modules/tableUpOverride': TableUpOverride,
    ...register,
  }, true);
  const container = document.body.appendChild(document.createElement('div'));
  container.innerHTML = normalizeHTML(html);
  const quill = new Quill(container, {
    modules: {
      tableUpOverride: options,
      history: {
        delay: 0,
      },
      ...moduleOptions,
    },
  });
  return quill;
};

describe('test utils', () => {
  it('test findParentBlot', async () => {
    const quill = await createTable(1, 1);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    const tableCellBlot = findParentBlot(tds[0], blotName.tableCell);
    expect(tableCellBlot).toBeInstanceOf(TableCellFormat);
    const tableRowBlot = findParentBlot(tds[0], blotName.tableRow);
    expect(tableRowBlot).toBeInstanceOf(TableRowFormat);
    const tableBodyBlot = findParentBlot(tds[0], blotName.tableBody);
    expect(tableBodyBlot).toBeInstanceOf(TableBodyFormat);
    const tableMainBlot = findParentBlot(tds[0], blotName.tableMain);
    expect(tableMainBlot).toBeInstanceOf(TableMainFormat);
    const tableWrapperBlot = findParentBlot(tds[0], blotName.tableWrapper);
    expect(tableWrapperBlot).toBeInstanceOf(TableWrapperFormat);
    expect(() => findParentBlot(tds[0], 'scroll')).toThrowError(`${blotName.tableCellInner} must be a child of scroll`);
  });

  it('test findParentBlots', async () => {
    const quill = await createTable(1, 1);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    const [tableCellBlot, tableRowBlot, tableBodyBlot, tableMainBlot, tableWrapperBlot] = findParentBlots(
      tds[0],
      [
        blotName.tableCell,
        blotName.tableRow,
        blotName.tableBody,
        blotName.tableMain,
        blotName.tableWrapper,
      ] as const,
    );
    expect(tableCellBlot).toBeInstanceOf(TableCellFormat);
    expect(tableRowBlot).toBeInstanceOf(TableRowFormat);
    expect(tableBodyBlot).toBeInstanceOf(TableBodyFormat);
    expect(tableMainBlot).toBeInstanceOf(TableMainFormat);
    expect(tableWrapperBlot).toBeInstanceOf(TableWrapperFormat);
  });
});

describe('test override format', () => {
  it('should change blotName', async () => {
    updateTableConstants({
      blotName: {
        tableCol: 'a-col',
        tableCellInner: 'a-cell-inner',
      },
    });
    const quill = await createTable(2, 2);
    expect(quill.getContents()).toMatchObject({
      ops: [
        {
          insert: '\n',
        },
        {
          insert: {
            'a-col': {
              tableId: '1',
              colId: '1',
              full: true,
              width: 50,
            },
          },
        },
        {
          insert: {
            'a-col': {
              tableId: '1',
              colId: '2',
              full: true,
              width: 50,
            },
          },
        },
        {
          insert: '1',
        },
        {
          attributes: {
            'a-cell-inner': {
              tableId: '1',
              colId: '1',
              rowId: '1',
              rowspan: 1,
              colspan: 1,
            },
          },
          insert: '\n',
        },
        {
          insert: '2',
        },
        {
          attributes: {
            'a-cell-inner': {
              tableId: '1',
              colId: '2',
              rowId: '1',
              rowspan: 1,
              colspan: 1,
            },
          },
          insert: '\n',
        },
        {
          insert: '3',
        },
        {
          attributes: {
            'a-cell-inner': {
              tableId: '1',
              colId: '1',
              rowId: '2',
              rowspan: 1,
              colspan: 1,
            },
          },
          insert: '\n',
        },
        {
          insert: '4',
        },
        {
          attributes: {
            'a-cell-inner': {
              tableId: '1',
              colId: '2',
              rowId: '2',
              rowspan: 1,
              colspan: 1,
            },
          },
          insert: '\n',
        },
        {
          insert: '\n',
        },
      ],
    });
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(2, 2)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
    const tableModule = quill.getModule('tableUp') as TableUp;
    const table = quill.root.querySelector('table')!;
    tableModule.tableSelection = new TableSelection(tableModule, table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    tableModule.tableSelection.selectedTds = [tds[0], tds[1], tds[2], tds[3]];
    tableModule.mergeCells();
    await vi.runAllTimersAsync();
    expect(quill.getContents()).toMatchObject({
      ops: [
        {
          insert: '\n',
        },
        {
          insert: {
            'a-col': {
              tableId: '1',
              colId: '1',
              full: true,
              width: 100,
            },
          },
        },
        {
          insert: '1',
        },
        {
          attributes: {
            'a-cell-inner': {
              tableId: '1',
              colId: '1',
              rowId: '1',
              rowspan: 1,
              colspan: 1,
            },
          },
          insert: '\n',
        },
        {
          insert: '2',
        },
        {
          attributes: {
            'a-cell-inner': {
              tableId: '1',
              colId: '1',
              rowId: '1',
              rowspan: 1,
              colspan: 1,
            },
          },
          insert: '\n',
        },
        {
          insert: '3',
        },
        {
          attributes: {
            'a-cell-inner': {
              tableId: '1',
              colId: '1',
              rowId: '1',
              rowspan: 1,
              colspan: 1,
            },
          },
          insert: '\n',
        },
        {
          insert: '4',
        },
        {
          attributes: {
            'a-cell-inner': {
              tableId: '1',
              colId: '1',
              rowId: '1',
              rowspan: 1,
              colspan: 1,
            },
          },
          insert: '\n',
        },
        {
          insert: '\n',
        },
      ],
    });
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <div>
          <table cellpadding="0" cellspacing="0" data-full="true">
            ${createTaleColHTML(1)}
            <tbody>
              <tr data-row-id="1">
                <td rowspan="1" colspan="1" data-row-id="1" data-col-id="1">
                  <div data-rowspan="1" data-colspan="1" data-row-id="1" data-col-id="1">
                    <p>1</p>
                    <p>2</p>
                    <p>3</p>
                    <p>4</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('should change format name in delta', async () => {
    const quill = createOverridesTable(`<p><br></p>`);
    quill.setContents([
      { insert: '\n' },
      {
        insert: {
          'a-col': { tableId: '1', column: '1', full: true, width: 50 },
        },
      },
      {
        insert: {
          'a-col': { tableId: '1', column: '2', full: true, width: 50 },
        },
      },
      {
        attributes: {
          'a-cell-inner': { tableId: '1', row: '1', cell: '1', rowspan: 1, colspan: 1 },
        },
        insert: '\n',
      },
      {
        attributes: {
          'a-cell-inner': { tableId: '1', row: '1', cell: '2', rowspan: 1, colspan: 1 },
        },
        insert: '\n',
      },
      {
        attributes: {
          'a-cell-inner': { tableId: '1', row: '2', cell: '1', rowspan: 1, colspan: 1 },
        },
        insert: '\n',
      },
      {
        attributes: {
          'a-cell-inner': { tableId: '1', row: '2', cell: '2', rowspan: 1, colspan: 1 },
        },
        insert: '\n',
      },
      { insert: '\n' },
    ]);
    await vi.runAllTimersAsync();
    expect(quill.getContents()).toMatchObject({
      ops: [
        {
          insert: '\n',
        },
        {
          insert: {
            'a-col': {
              tableId: '1',
              column: '1',
              full: true,
              width: 50,
            },
          },
        },
        {
          insert: {
            'a-col': {
              tableId: '1',
              column: '2',
              full: true,
              width: 50,
            },
          },
        },
        {
          attributes: {
            'a-cell-inner': {
              tableId: '1',
              cell: '1',
              row: '1',
              rowspan: 1,
              colspan: 1,
            },
          },
          insert: '\n',
        },
        {
          attributes: {
            'a-cell-inner': {
              tableId: '1',
              cell: '2',
              row: '1',
              rowspan: 1,
              colspan: 1,
            },
          },
          insert: '\n',
        },
        {
          attributes: {
            'a-cell-inner': {
              tableId: '1',
              cell: '1',
              row: '2',
              rowspan: 1,
              colspan: 1,
            },
          },
          insert: '\n',
        },
        {
          attributes: {
            'a-cell-inner': {
              tableId: '1',
              cell: '2',
              row: '2',
              rowspan: 1,
              colspan: 1,
            },
          },
          insert: '\n',
        },
        {
          insert: '\n',
        },
      ],
    });
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(2, 2, {}, { isEmpty: true })}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });

  it('should change format name in delta with contents', async () => {
    const quill = createOverridesTable(`<p><br></p>`);
    quill.setContents([
      { insert: '\n' },
      {
        insert: {
          'a-col': { tableId: '1', column: '1', full: true, width: 50 },
        },
      },
      {
        insert: {
          'a-col': { tableId: '1', column: '2', full: true, width: 50 },
        },
      },
      { insert: '1' },
      {
        attributes: {
          'a-cell-inner': { tableId: '1', row: '1', cell: '1', rowspan: 1, colspan: 1 },
        },
        insert: '\n',
      },
      { insert: '2' },
      {
        attributes: {
          'a-cell-inner': { tableId: '1', row: '1', cell: '2', rowspan: 1, colspan: 1 },
        },
        insert: '\n',
      },
      { insert: '3' },
      {
        attributes: {
          'a-cell-inner': { tableId: '1', row: '2', cell: '1', rowspan: 1, colspan: 1 },
        },
        insert: '\n',
      },
      { insert: '4' },
      {
        attributes: {
          'a-cell-inner': { tableId: '1', row: '2', cell: '2', rowspan: 1, colspan: 1 },
        },
        insert: '\n',
      },
      { insert: '\n' },
    ]);
    await vi.runAllTimersAsync();
    expect(quill.getContents()).toMatchObject({
      ops: [
        {
          insert: '\n',
        },
        {
          insert: {
            'a-col': {
              tableId: '1',
              column: '1',
              full: true,
              width: 50,
            },
          },
        },
        {
          insert: {
            'a-col': {
              tableId: '1',
              column: '2',
              full: true,
              width: 50,
            },
          },
        },
        { insert: '1' },
        {
          attributes: {
            'a-cell-inner': {
              tableId: '1',
              cell: '1',
              row: '1',
              rowspan: 1,
              colspan: 1,
            },
          },
          insert: '\n',
        },
        { insert: '2' },
        {
          attributes: {
            'a-cell-inner': {
              tableId: '1',
              cell: '2',
              row: '1',
              rowspan: 1,
              colspan: 1,
            },
          },
          insert: '\n',
        },
        { insert: '3' },
        {
          attributes: {
            'a-cell-inner': {
              tableId: '1',
              cell: '1',
              row: '2',
              rowspan: 1,
              colspan: 1,
            },
          },
          insert: '\n',
        },
        { insert: '4' },
        {
          attributes: {
            'a-cell-inner': {
              tableId: '1',
              cell: '2',
              row: '2',
              rowspan: 1,
              colspan: 1,
            },
          },
          insert: '\n',
        },
        {
          insert: '\n',
        },
      ],
    });
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        ${createTableHTML(2, 2)}
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'contenteditable'] },
    );
  });
});
