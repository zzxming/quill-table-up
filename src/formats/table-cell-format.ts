import type { TableCellValue } from '../utils';
import { blotName } from '../utils';
import { TableCellInnerFormat } from './table-cell-inner-format';
import { ContainerFormat } from './container-format';

export class TableCellFormat extends ContainerFormat {
  static blotName = blotName.tableCell;
  static tagName = 'td';
  static className = 'ql-table-cell';

  // for TableSelection computed selectedTds
  __rect?: DOMRect;

  static create(value: TableCellValue) {
    const { tableId, rowId, colId, rowspan, colspan, backgroundColor, height } = value;
    const node = super.create() as HTMLElement;
    node.dataset.tableId = tableId;
    node.dataset.rowId = rowId;
    node.dataset.colId = colId;
    node.setAttribute('rowspan', String(rowspan || 1));
    node.setAttribute('colspan', String(colspan || 1));
    backgroundColor && (node.style.backgroundColor = backgroundColor);
    height && (node.setAttribute('height', String(height)));
    return node;
  }

  get tableId() {
    return this.domNode.dataset.tableId!;
  }

  get rowId() {
    return this.domNode.dataset.rowId!;
  }

  set rowId(value) {
    this.domNode.dataset.rowId = value;
  }

  get colId() {
    return this.domNode.dataset.colId!;
  }

  set colId(value) {
    this.domNode.dataset.colId = value;
  }

  get rowspan() {
    return Number(this.domNode.getAttribute('rowspan'));
  }

  set rowspan(value: number) {
    this.domNode.setAttribute('rowspan', String(value));
  }

  get colspan() {
    return Number(this.domNode.getAttribute('colspan'));
  }

  set colspan(value: number) {
    this.domNode.setAttribute('colspan', String(value));
  }

  get backgroundColor() {
    return this.domNode.dataset.backgroundColor || '';
  }

  set backgroundColor(value: string) {
    Object.assign(this.domNode.style, {
      backgroundColor: value,
    });
  }

  get height(): number {
    return Number(this.domNode.getAttribute('height')) || 0;
  }

  set height(value: number) {
    if (value > 0) {
      this.domNode.setAttribute('height', String(value));
    }
  }

  getCellInner() {
    return this.descendants(TableCellInnerFormat)[0];
  }

  checkMerge(): boolean {
    const { colId, rowId } = this.domNode.dataset;
    const next = this.next;
    return (
      next !== null
      && next.statics.blotName === this.statics.blotName
      && (next.domNode as HTMLElement).dataset.rowId === rowId
      && (next.domNode as HTMLElement).dataset.colId === colId
    );
  }

  deleteAt(index: number, length: number) {
    if (index === 0 && length === this.length()) {
      const cell = (this.next || this.prev) as this;
      const cellInner = cell && cell.getCellInner();
      if (cellInner) {
        cellInner.colspan += this.colspan;
      }
      return this.remove();
    }
    this.children.forEachAt(index, length, (child, offset, length) => {
      child.deleteAt(offset, length);
    });
  }

  optimize(context: Record<string, any>) {
    const parent = this.parent;
    const { tableId, rowId } = this;

    if (parent !== null && parent.statics.blotName !== blotName.tableRow) {
      this.wrap(blotName.tableRow, { tableId, rowId });
    }

    super.optimize(context);
  }
}
