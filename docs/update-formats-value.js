/**
 *  This file is an example of modifying the blot name and delta data structure
 
 * Change the blot name
 *  table-up-col -> a-col
 *  table-up-cell -> a-cell
 *  table-up-cell-inner -> a-cell-inner
 
 * Change the delta data structure
 *  colId -> column
 *  rowId -> row
 *  colId -> cell
 
 */

import Quill from 'quill';
import { defaultCustomSelect, TableAlign, TableCellFormat, TableCellInnerFormat, TableColFormat, TableMenuContextmenu, TableResizeBox, TableSelection, TableUp, TableVirtualScrollbar, updateTableConstants } from 'table-up';

updateTableConstants({
  /**
   * Change the blot name
   *  table-up-col -> a-col
   *  table-up-cell -> a-cell
   *  table-up-cell-inner -> a-cell-inner
   */
  blotName: {
    tableCol: 'a-col',
    tableCell: 'a-cell',
    tableCellInner: 'a-cell-inner',
  },
});
// rename `colId` to `column`
class TableColFormatOverride extends TableColFormat {
  static create(value) {
    const { colId, column } = value;
    const node = super.create(value);
    node.dataset.colId = column || colId;
    return node;
  }

  static value(domNode) {
    const value = super.value(domNode);
    value.column = value.colId;
    delete value.colId;
    return value;
  }
}
// rename `rowId` to `row`, `colId` to `cell`
class TableCellFormatOverride extends TableCellFormat {
  static allowDataAttrs = new Set(['table-id', 'row', 'cell']);
  static create(value) {
    const node = super.create(value);
    let { rowId, colId, row, cell } = value;
    row = row || rowId;
    cell = cell || colId;
    node.dataset.row = row;
    node.dataset.cell = cell;
    node.removeAttribute('data-row-id');
    node.removeAttribute('data-col-id');
    return node;
  }

  static formats(domNode) {
    const value = super.formats(domNode);
    const { row, cell } = domNode.dataset;
    value.row = row;
    value.cell = cell;
    delete value.rowId;
    delete value.colId;
    return value;
  }

  get rowId() {
    return this.domNode.dataset.row;
  }

  get colId() {
    return this.domNode.dataset.cell;
  }
}
class TableCellInnerFormatOverride extends TableCellInnerFormat {
  static allowDataAttrs = new Set(['table-id', 'row', 'cell', 'rowspan', 'colspan']);
  static create(value) {
    const node = super.create(value);
    let { rowId, colId, row, cell } = value;
    row = row || rowId;
    cell = cell || colId;
    node.dataset.row = row;
    node.dataset.cell = cell;
    node.removeAttribute('data-row-id');
    node.removeAttribute('data-col-id');
    return node;
  }

  static formats(domNode) {
    const value = super.formats(domNode);
    const { row, cell } = domNode.dataset;
    value.row = row;
    value.cell = cell;
    delete value.rowId;
    delete value.colId;
    return value;
  }

  get rowId() {
    return this.domNode.dataset.row;
  }

  set rowId(value) {
    this.setFormatValue('row', value);
  }

  get colId() {
    return this.domNode.dataset.cell;
  }

  set colId(value) {
    this.setFormatValue('cell', value);
  }
}
class TableUpOverride extends TableUp {
  static register() {
    super.register();
    // Override the formats
    Quill.register({
      'formats/a-col': TableColFormatOverride,
      'formats/a-cell': TableCellFormatOverride,
      'formats/a-cell-inner': TableCellInnerFormatOverride,
    }, true);
  }
}

Quill.register({
  [`modules/${TableUp.moduleName}`]: TableUpOverride,
}, true);

const quill = new Quill('#editor1', {
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block', 'code'],
      ['link', 'image', 'video', 'formula'],
      [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ direction: 'rtl' }],
      [{ size: ['small', false, 'large', 'huge'] }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ color: [] }, { background: [] }],
      [{ font: [] }],
      [{ align: [] }],
      [{ [TableUp.toolName]: [] }],
      ['clean'],
    ],
    [TableUp.moduleName]: {
      customSelect: defaultCustomSelect,
      modules: [
        { module: TableVirtualScrollbar },
        { module: TableAlign },
        { module: TableResizeBox },
        { module: TableSelection },
        { module: TableMenuContextmenu },
      ],
    },
  },
});

quill.setContents([
  { insert: '\n' },
  { insert: { 'a-col': { tableId: '1', column: '1', full: true, width: 50 } } },
  { insert: { 'a-col': { tableId: '1', column: '2', full: true, width: 50 } } },
  { attributes: { 'a-cell-inner': { tableId: '1', row: '1', cell: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
  { attributes: { 'a-cell-inner': { tableId: '1', row: '1', cell: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
  { attributes: { 'a-cell-inner': { tableId: '1', row: '2', cell: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
  { attributes: { 'a-cell-inner': { tableId: '1', row: '2', cell: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
  { insert: '\n' },
]);
