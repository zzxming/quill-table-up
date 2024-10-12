import Quill from 'quill';
import { TableCellInnerFormat, TableColFormat, TableUp, updateTableConstants } from 'table-up';

updateTableConstants({
  blotName: {
    tableCol: 'a-col',
    tableCellInner: 'a-cell-inner',
  },
});
class TableColFormatOverride extends TableColFormat {
  static create(value) {
    const { width, tableId, colId, column, full } = value;
    const node = super.create(value);
    node.setAttribute('width', `${Number.parseFloat(width)}${full ? '%' : 'px'}`);
    full && (node.dataset.full = String(full));
    node.dataset.tableId = tableId;
    node.dataset.colId = colId || column;
    node.setAttribute('contenteditable', 'false');
    return node;
  }

  static value(domNode) {
    const { tableId, colId } = domNode.dataset;
    const width = domNode.getAttribute('width');
    const full = Object.hasOwn(domNode.dataset, 'full');
    const value = {
      tableId,
      column: colId,
      full,
    };
    width && (value.width = Number.parseFloat(width));
    return value;
  }
}
class TableCellInnerFormatOverride extends TableCellInnerFormat {
  static create(value) {
    let { tableId, rowId, colId, row, cell, rowspan, colspan, backgroundColor, height } = value;
    rowId = rowId || row;
    colId = colId || cell;
    const node = super.create(value);
    node.dataset.tableId = tableId;
    node.dataset.rowId = rowId;
    node.dataset.colId = colId;
    node.dataset.rowspan = String(rowspan || 1);
    node.dataset.colspan = String(colspan || 1);
    height && (node.dataset.height = height);
    backgroundColor && (node.dataset.backgroundColor = backgroundColor);
    return node;
  }

  formats() {
    const { tableId, rowId, colId, rowspan, colspan, backgroundColor, height } = this;
    const value = {
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
  static register() {
    super.register();
    Quill.register({
      'formats/a-col': TableColFormatOverride,
      'formats/a-cell-inner': TableCellInnerFormatOverride,
    }, true);
  }
}

Quill.register({
  [`modules/${TableUp.moduleName}`]: TableUpOverride,
}, true);

const quill = new Quill('#editor', {
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
    [TableUp.moduleName]: {},
  },
});

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
