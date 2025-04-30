import type { TableValue } from '../utils';
import { blotName, tableUpSize } from '../utils';
import { ContainerFormat } from './container-format';
import { TableColFormat } from './table-col-format';
import { TableRowFormat } from './table-row-format';

export class TableMainFormat extends ContainerFormat {
  static blotName = blotName.tableMain;
  static tagName = 'table';
  static className = 'ql-table';

  static create(value: TableValue) {
    const node = super.create() as HTMLElement;
    const { tableId, full, align } = value;
    node.dataset.tableId = tableId;
    if (align === 'right' || align === 'center') {
      node.dataset.align = align;
    }
    else {
      node.removeAttribute('date-align');
    }
    full && (node.dataset.full = String(full));
    node.setAttribute('cellpadding', '0');
    node.setAttribute('cellspacing', '0');
    return node;
  }

  constructor(scroll: any, domNode: HTMLElement, _value: any) {
    super(scroll, domNode);
    this.updateAlign();
  }

  colWidthFillTable() {
    if (this.full) {
      Object.assign(this.domNode.style, { width: null });
      return;
    }
    const cols = this.getCols();
    if (!cols) return;
    const colsWidth = cols.reduce((sum, col) => col.width + sum, 0);
    if (colsWidth === 0 || Number.isNaN(colsWidth)) return;
    this.domNode.style.width = `${colsWidth}px`;
    return colsWidth;
  }

  get tableId() {
    return this.domNode.dataset.tableId!;
  }

  get full() {
    return Object.hasOwn(this.domNode.dataset, 'full');
  }

  set full(value: boolean) {
    if (value) {
      this.domNode.dataset.full = String(true);
    }
    else {
      this.domNode.removeAttribute('data-full');
    }
    this.colWidthFillTable();
  }

  get align() {
    return this.domNode.dataset.align || '';
  }

  set align(value: string) {
    if (value === 'right' || value === 'center') {
      this.domNode.dataset.align = value;
    }
    else {
      this.domNode.removeAttribute('data-align');
    }
    this.updateAlign();
  }

  setFull() {
    if (this.full) return;
    const cols = this.getCols();
    if (cols.length === 0) return;
    const tableWidth = Math.floor(this.domNode.getBoundingClientRect().width);
    for (const col of cols) {
      const value = col.width / tableWidth * 100;
      col.full = true;
      col.width = value;
    }
  }

  cancelFull() {
    if (!this.full) return;
    const cols = this.getCols();
    if (cols.length === 0) return;
    const tableWidth = Math.floor(this.domNode.getBoundingClientRect().width);
    for (const col of cols) {
      col.full = false;
      col.width = Math.max(col.width / 100 * tableWidth, tableUpSize.colMinWidthPx);
    }
  }

  updateAlign() {
    const value = this.align;
    const style: Record<string, string | null> = {
      marginLeft: null,
      marginRight: null,
    };
    switch (value) {
    case 'center': {
      style.marginLeft = 'auto';
      style.marginRight = 'auto';
      break;
    }
    case '':
    case 'left': {
      style.marginRight = 'auto';
      break;
    }
    case 'right': {
      style.marginLeft = 'auto';
      break;
    }
    default: {
      break;
    }
    }
    Object.assign(this.domNode.style, style);
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
      && next.domNode.dataset.tableId === this.tableId
    );
  }

  optimize(context: Record<string, any>) {
    const parent = this.parent;
    if (parent !== null && parent.statics.blotName !== blotName.tableWrapper) {
      this.wrap(blotName.tableWrapper, this.tableId);
    }

    super.optimize(context);
  }
}
