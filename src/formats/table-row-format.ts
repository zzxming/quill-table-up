import type { Parchment as TypeParchment } from 'quill';
import type { TableCellValue, TableRowValue } from '../utils';
import { blotName, findParentBlot } from '../utils';
import { ContainerFormat } from './container-format';
import { TableCellInnerFormat } from './table-cell-inner-format';
import type { TableCellFormat } from './table-cell-format';

export type SkipRowCount = number[] & { skipRowNum?: number };
export class TableRowFormat extends ContainerFormat {
  static blotName = blotName.tableRow;
  static tagName = 'tr';
  static className = 'ql-table-row';

  static create(value: TableRowValue) {
    const node = super.create() as HTMLElement;
    node.dataset.rowId = value.rowId;
    node.dataset.tableId = value.tableId;
    return node;
  }

  declare children: TypeParchment.LinkedList<TableCellFormat>;
  resorting: boolean = false;

  checkMerge(): boolean {
    const next = this.next;
    return (
      next !== null
      && next.statics.blotName === this.statics.blotName
      && next.domNode.dataset.rowId === this.rowId
    );
  }

  get rowId() {
    return this.domNode.dataset.rowId!;
  }

  get tableId() {
    return this.domNode.dataset.tableId!;
  }

  setHeight(value: number) {
    this.foreachCellInner((cellInner) => {
      cellInner.height = value;
    });
  }

  // insert cell at index
  // return the minus skip column number
  // [2, 3]. means next line should skip 2 columns. next next line skip 3 columns
  insertCell(targetIndex: number, value: TableCellValue) {
    const skip: SkipRowCount = [];
    const next = this.children.iterator();
    let index = 0;
    let cur;
    while ((cur = next())) {
      index += cur.colspan;
      if (index > targetIndex) break;
      if (cur.rowspan !== 1) {
        for (let i = 0; i < cur.rowspan - 1; i++) {
          skip[i] = (skip[i] || 0) + cur.colspan;
        }
      }
    }

    if (cur && index - cur.colspan < targetIndex) {
      const tableCell = cur.getCellInner();
      tableCell.colspan += 1;
      if (cur.rowspan !== 1) {
        skip.skipRowNum = cur.rowspan - 1;
      }
    }
    else {
      const tableCell = this.scroll.create(blotName.tableCell, value) as ContainerFormat;
      const tableCellInner = this.scroll.create(blotName.tableCellInner, value) as ContainerFormat;
      const block = this.scroll.create('block') as TypeParchment.BlockBlot;
      block.appendChild(this.scroll.create('break'));
      tableCellInner.appendChild(block);
      tableCell.appendChild(tableCellInner);
      this.insertBefore(tableCell, cur);
    }
    return skip;
  }

  getCellByColumIndex(stopIndex: number): [null | TableCellFormat, number, number[]] {
    const skip: number[] = [];
    let cur: null | TableCellFormat = null;
    let cellEndIndex = 0;
    if (stopIndex < 0) return [cur, cellEndIndex, skip];
    const next = this.children.iterator();
    while ((cur = next())) {
      cellEndIndex += cur.colspan;
      if (cur.rowspan !== 1) {
        for (let i = 0; i < cur.rowspan - 1; i++) {
          skip[i] = (skip[i] || 0) + cur.colspan;
        }
      }
      if (cellEndIndex > stopIndex) break;
    }
    return [cur, cellEndIndex, skip];
  }

  removeCell(targetIndex: number): SkipRowCount {
    if (targetIndex < 0) return [];
    const columnIndexData = this.getCellByColumIndex(targetIndex);
    const [cur, index] = columnIndexData;
    const skip: SkipRowCount = columnIndexData[2];
    if (!cur) return skip;
    if (index - cur.colspan < targetIndex || cur.colspan > 1) {
      const [tableCell] = cur.descendants(TableCellInnerFormat);

      if (cur.colspan !== 1 && targetIndex === index - cur.colspan) {
        // if delete index is cell start index. update cell colId to next colId
        const tableBlot = findParentBlot(this, blotName.tableMain);
        const colIds = tableBlot.getColIds();
        tableCell.colId = colIds[colIds.indexOf(tableCell.colId) + 1];
      }
      if (cur.rowspan !== 1) {
        skip.skipRowNum = cur.rowspan - 1;
      }

      tableCell.colspan -= 1;
    }
    else {
      cur.remove();
    }
    return skip;
  }

  foreachCellInner(func: (tableCell: TableCellInnerFormat, index: number) => boolean | void) {
    const next = this.children.iterator();
    let i = 0;
    let cur: TableCellFormat | null;
    while ((cur = next())) {
      const [tableCell] = cur.descendants(TableCellInnerFormat);
      if (func(tableCell, i++)) break;
    }
  }

  optimize(context: Record<string, any>) {
    const parent = this.parent;
    const { tableId } = this;
    if (parent !== null && parent.statics.blotName !== blotName.tableBody) {
      this.wrap(blotName.tableBody, tableId);
    }

    super.optimize(context);
  }
}
