import Quill from 'quill';
import { blotName } from '../assets/const';
import { TableRowFormat } from './TableRowFormat';
import { TableColFormat } from './TableColFormat';

const Container = Quill.import('blots/container');
const Parchment = Quill.import('parchment');

class TableFormat extends Container {
  constructor(domNode, value) {
    super(domNode, value);

    this.formatTableWidth();
  }

  static create(value) {
    const node = super.create();

    node.dataset.tableId = value;
    node.classList.add('ql-table');
    node.setAttribute('cellpadding', 0);
    node.setAttribute('cellspacing', 0);

    return node;
  }

  colWidthFillTable() {
    if (this.full) return;
    const cols = this.descendants(TableColFormat);
    if (!cols) return;
    const colsWidth = cols.reduce((sum, col) => col.width + sum, 0);
    if (colsWidth === 0 || Number.isNaN(colsWidth) || this.full) return null;
    this.domNode.style.width = `${colsWidth}px`;
    return colsWidth;
  }

  formatTableWidth() {
    setTimeout(() => {
      this.colWidthFillTable();
    }, 0);
  }

  get tableId() {
    return this.domNode.dataset.tableId;
  }

  get full() {
    return Object.hasOwn(this.domNode.dataset, 'full');
  }

  set full(value) {
    this.domNode[value ? 'setAttribute' : 'removeAttribute']('data-full', '');
  }

  getRows() {
    return this.descendants(TableRowFormat);
  }

  getRowIds() {
    return this.getRows().map(d => d.rowId);
  }

  getCols() {
    return this.descendants(TableColFormat);
  }

  getColIds() {
    return this.getCols().map(d => d.colId);
  }

  optimize() {
    super.optimize();
    const next = this.next;
    if (
      next != null
      && next.prev === this
      && next.statics.blotName === this.statics.blotName
      && next.domNode.tagName === this.domNode.tagName
      && next.domNode.dataset.tableId === this.domNode.dataset.tableId
    ) {
      next.moveChildren(this);
      next.remove();
    }
  }
}

TableFormat.blotName = blotName.table;
TableFormat.tagName = 'table';
TableFormat.scope = Parchment.Scope.BLOCK_BLOT;

export { TableFormat };
