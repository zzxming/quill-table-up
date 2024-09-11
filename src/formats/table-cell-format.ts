import type { TableCellValue } from '../utils';
import { blotName, findParentBlot } from '../utils';
import { TableCellInnerFormat } from './table-cell-inner-format';
import { ContainerFormat } from './container-format';
import type { TableRowFormat } from './table-row-format';

let tempOptimizeRowIds: string[] = [];
let timer: ReturnType<typeof setTimeout>;
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

  optimize(context: Record<string, any>) {
    const parent = this.parent as TableRowFormat;
    const { tableId, rowId } = this;

    if (parent !== null && parent.statics.blotName !== blotName.tableRow) {
      this.wrap(blotName.tableRow, { tableId, rowId });
    }
    if (parent && parent.statics.blotName === blotName.tableRow && parent.rowId !== this.rowId) {
      const tableBlot = findParentBlot(this, blotName.tableMain);
      const colIds = tableBlot.getColIds();
      if (tempOptimizeRowIds.length === 0) {
        tempOptimizeRowIds = tableBlot.getRowIds();
      }
      const selfColIndex = colIds.indexOf(this.colId);
      const selfRowIndex = tempOptimizeRowIds.indexOf(this.rowId);
      const rowBlot = this.wrap(blotName.tableRow, { tableId, rowId });
      const findInsertBefore = (parent: TableRowFormat | null): TableRowFormat | null => {
        if (!parent) return parent;
        const rowIndex = tempOptimizeRowIds.indexOf(parent.rowId);
        if (selfRowIndex === -1) {
          // find before optimize start already have row
          let returnRow: TableRowFormat | null = parent.next as TableRowFormat;
          while (returnRow && rowIndex > tempOptimizeRowIds.indexOf(returnRow.rowId)) {
            returnRow = returnRow.next as TableRowFormat | null;
          }
          return returnRow;
        }
        if (rowIndex === selfRowIndex) {
          const parentColIndex = colIds.indexOf(parent.children!.head!.colId);
          return parentColIndex < selfColIndex ? findInsertBefore(parent.next as TableRowFormat) : parent;
        }
        return rowIndex < selfRowIndex ? findInsertBefore(parent.next as TableRowFormat) : parent;
      };
      const ins = findInsertBefore(parent);
      parent.parent.insertBefore(rowBlot, ins);
    }

    super.optimize(context);
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      tempOptimizeRowIds = [];
    }, 0);
  }
}
