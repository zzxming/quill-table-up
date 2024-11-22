import type { TableCellValue } from '../utils';
import type { TableRowFormat } from './table-row-format';
import { blotName } from '../utils';
import { ContainerFormat } from './container-format';
import { TableCellInnerFormat } from './table-cell-inner-format';

export class TableCellFormat extends ContainerFormat {
  static blotName = blotName.tableCell;
  static tagName = 'td';
  static className = 'ql-table-cell';

  static create(value: TableCellValue) {
    const { tableId, rowId, colId, rowspan, colspan, backgroundColor, height } = value;
    const node = super.create() as HTMLElement;
    node.dataset.tableId = tableId;
    node.dataset.rowId = rowId;
    node.dataset.colId = colId;
    node.setAttribute('rowspan', String(rowspan || 1));
    node.setAttribute('colspan', String(colspan || 1));
    backgroundColor && (node.style.backgroundColor = backgroundColor);
    height && (node.style.height = height);
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

  set backgroundColor(value: string | null) {
    Object.assign(this.domNode.style, {
      backgroundColor: value,
    });
  }

  get height() {
    return this.domNode.style.height;
  }

  set height(value: string) {
    if (value) {
      this.domNode.style.height = value;
    }
  }

  getCellInner() {
    return this.descendants(TableCellInnerFormat)[0];
  }

  checkMerge(): boolean {
    const { colId, rowId, colspan, rowspan } = this;
    const next = this.next as TableCellFormat;
    return (
      next !== null
      && next.statics.blotName === this.statics.blotName
      && next.rowId === rowId
      && next.colId === colId
      && next.colspan === colspan
      && next.rowspan === rowspan
    );
  }

  optimize(context: Record<string, any>) {
    const parent = this.parent as TableRowFormat;
    const { tableId, rowId } = this;
    if (parent !== null && parent.statics.blotName !== blotName.tableRow) {
      this.wrap(blotName.tableRow, { tableId, rowId });
    }

    super.optimize(context);
  }
}
