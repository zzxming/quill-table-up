import type { Parchment as TypeParchment } from 'quill';
import type { TableColValue, TableValue } from '../utils';
import type { TableColFormat } from './table-col-format';
import { blotName, findParentBlot, tableUpSize } from '../utils';
import { ContainerFormat } from './container-format';
import { TableMainFormat } from './table-main-format';

export class TableColgroupFormat extends ContainerFormat {
  static blotName = blotName.tableColgroup;
  static tagName = 'colgroup';
  declare children: TypeParchment.LinkedList<TableColFormat>;

  static create(value: TableValue) {
    const node = super.create() as HTMLElement;
    node.dataset.tableId = value.tableId;
    value.full && (node.dataset.full = String(value.full));
    if (value.align && value.align !== 'left') {
      node.dataset.align = value.align;
    }
    node.setAttribute('contenteditable', 'false');
    return node;
  }

  get tableId() {
    return this.domNode.dataset.tableId!;
  }

  get full() {
    return Object.hasOwn(this.domNode.dataset, 'full');
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
        if (cur.width - tableCellInner.width >= tableUpSize.colMinWidthPre) {
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
      if (table.full) {
        if (col.next) {
          (col.next as TableColFormat).width += col.width;
        }
        else if (col.prev) {
          (col.prev as TableColFormat).width += col.width;
        }
      }
      col.remove();
      table.colWidthFillTable();
    }
  }

  checkMerge(): boolean {
    const next = this.next as TableColgroupFormat;
    const tableMain = this.parent;
    if ((tableMain instanceof TableMainFormat) && !tableMain.full) {
      tableMain.colWidthFillTable();
    }
    return (
      next !== null
      && next.statics.blotName === this.statics.blotName
      && next.tableId === this.tableId
    );
  }

  optimize(context: Record<string, any>) {
    const parent = this.parent;
    const { tableId, full, align } = this;
    if (parent != null && parent.statics.blotName !== blotName.tableMain) {
      this.wrap(blotName.tableMain, { tableId, full, align });
    }

    const tableMain = findParentBlot(this, blotName.tableMain);
    tableMain.align = align;

    super.optimize(context);
  }
}
