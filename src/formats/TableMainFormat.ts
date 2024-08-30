import type { Parchment as TypeParchment } from 'quill';
import { blotName } from '../utils';
import { TableRowFormat } from './TableRowFormat';
import { ContainerFormat } from './ContainerFormat';
import { TableColFormat } from './TableColFormat';

export class TableMainFormat extends ContainerFormat {
  static blotName = blotName.tableMain;
  static tagName = 'table';

  constructor(scroll: TypeParchment.Root, domNode: Node) {
    super(scroll, domNode);

    // this.formatTableWidth();
  }

  static create(value: string) {
    const node = super.create() as HTMLElement;

    node.dataset.tableId = value;
    node.classList.add('ql-table');
    node.setAttribute('cellpadding', '0');
    node.setAttribute('cellspacing', '0');

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
    return this.domNode.dataset.tableId!;
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

  checkMerge(): boolean {
    const next = this.next;
    return (
      next !== null
      && next.statics.blotName === this.statics.blotName
      && next.domNode.tagName === this.domNode.tagName
      && next.domNode.dataset.tableId === this.tableId
    );
  }
}
