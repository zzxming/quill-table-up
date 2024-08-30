import { blotName } from '../utils';
import { ContainerFormat } from './container-format';

export class TableColgroupFormat extends ContainerFormat {
  static blotName = blotName.tableColGroup;
  static tagName = 'colgroup';

  deleteAt(index: number, length: number) {
    if (index === 0 && length === this.length()) {
      return this.parent.remove();
    }
    super.deleteAt(index, length);
  }

  findCol(index: number) {
    const next = this.children.iterator();
    let i = 0;
    let cur = next();
    while (cur) {
      if (i === index) {
        break;
      }
      i++;
      cur = next();
    }
    return cur;
  }

  // insertColByIndex(index, value) {
  //   const table = this.parent;
  //   if (!(table instanceof TableFormat)) {
  //     throw new TypeError('TableColgroupFormat should be child of TableFormat');
  //   }
  //   const col = this.findCol(index);
  //   const tableCellInner = Parchment.create(blotName.tableCol, value);
  //   if (table.full) {
  //   // TODO: first minus column should be near by
  //     const next = this.children.iterator();
  //     let cur;
  //     while ((cur = next())) {
  //       if (cur.width - tableCellInner.width >= CELL_MIN_PRE) {
  //         cur.width -= tableCellInner.width;
  //         break;
  //       }
  //     }
  //   }
  //   this.insertBefore(tableCellInner, col);
  // }

  // removeColByIndex(index) {
  //   const table = this.parent;
  //   if (!(table instanceof TableFormat)) {
  //     throw new TypeError('TableColgroupFormat should be child of TableFormat');
  //   }
  //   const col = this.findCol(index);
  //   if (col.next) {
  //     col.next.width += col.width;
  //   }
  //   else if (col.prev) {
  //     col.prev.width += col.width;
  //   }
  //   col.remove();
  // }
}
