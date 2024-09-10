import type { Parchment as TypeParchment } from 'quill';
import type { TableColValue, TableValue } from '../utils';
import { blotName, tableColMinWidthPre } from '../utils';
import { ContainerFormat } from './container-format';
import type { TableColFormat } from './table-col-format';
import { TableMainFormat } from './table-main-format';

export class TableColgroupFormat extends ContainerFormat {
  static blotName = blotName.tableColgroup;
  static tagName = 'colgroup';
  declare children: TypeParchment.LinkedList<TableColFormat>;

  static create(value: TableValue) {
    const node = super.create() as HTMLElement;
    node.dataset.tableId = value.tableId;
    value.full && (node.dataset.full = String(value.full));
    return node;
  }

  get tableId() {
    return this.domNode.dataset.tableId!;
  }

  get full() {
    return Object.hasOwn(this.domNode.dataset, 'full');
  }

  findCol(index: number) {
    const next = this.children.iterator();
    let i = 0;
    let cur: TableColFormat | null;
    while ((cur = next())) {
      if (i === index) {
        break;
      }
      i++;
    }
    return cur;
  }

  insertColByIndex(index: number, value: TableColValue) {
    const table = this.parent;
    if (!(table instanceof TableMainFormat)) {
      throw new TypeError('TableColgroupFormat should be child of TableFormat');
    }
    const col = this.findCol(index);
    const tableCellInner = this.scroll.create(blotName.tableCol, value) as TableColFormat;
    if (table.full) {
      // TODO: first minus column should be near by
      const next = this.children.iterator();
      let cur: TableColFormat | null;
      while ((cur = next())) {
        if (cur.width - tableCellInner.width >= tableColMinWidthPre) {
          cur.width -= tableCellInner.width;
          break;
        }
      }
    }
    this.insertBefore(tableCellInner, col);
  }

  removeColByIndex(index: number) {
    const table = this.parent;
    if (!(table instanceof TableMainFormat)) {
      throw new TypeError('TableColgroupFormat should be child of TableMainFormat');
    }
    const col = this.findCol(index);
    if (col) {
      if (col.next) {
        (col.next as TableColFormat).width += col.width;
      }
      else if (col.prev) {
        (col.prev as TableColFormat).width += col.width;
      }
      col.remove();
    }
  }

  optimize(context: Record< string, any>) {
    const parent = this.parent;
    if (parent != null && parent.statics.blotName !== blotName.tableMain) {
      const { tableId, full } = this;
      this.wrap(blotName.tableMain, { tableId, full });
    }
    super.optimize(context);
  }
}
