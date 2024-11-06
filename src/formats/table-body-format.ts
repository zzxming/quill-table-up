import { blotName, findParentBlot, randomId } from '../utils';
import { ContainerFormat } from './container-format';
import { TableRowFormat } from './table-row-format';

export class TableBodyFormat extends ContainerFormat {
  static blotName = blotName.tableBody;
  static tagName = 'tbody';

  static create(value: string) {
    const node = super.create() as HTMLElement;
    node.dataset.tableId = value;
    return node;
  }

  get tableId() {
    return this.domNode.dataset.tableId!;
  }

  // insert row at index
  insertRow(targetIndex: number) {
    const tableBlot = findParentBlot(this, blotName.tableMain);
    if (!tableBlot) return;
    // get all column id. exclude the columns of the target index row with rowspan
    const colIds = tableBlot.getColIds();
    const rows = this.descendants(TableRowFormat);
    const insertColIds = new Set(colIds);
    let index = 0;
    for (const row of rows) {
      if (index === targetIndex) break;
      row.foreachCellInner((cell) => {
        if (index + cell.rowspan > targetIndex) {
          cell.rowspan += 1;
          insertColIds.delete(cell.colId);
          // colspan cell need remove all includes colId
          if (cell.colspan !== 1) {
            const colIndex = colIds.indexOf(cell.colId);
            for (let i = 0; i < cell.colspan - 1; i++) {
              insertColIds.delete(colIds[colIndex + i + 1]);
            }
          }
        }
      });
      index += 1;
    }
    // append new row
    const tableId = tableBlot.tableId;
    const rowId = randomId();
    const tableRow = this.scroll.create(blotName.tableRow, {
      tableId,
      rowId,
    }) as ContainerFormat;
    for (const colId of insertColIds) {
      const breakBlot = this.scroll.create('break');
      const block = breakBlot.wrap('block');
      const tableCellInner = block.wrap(blotName.tableCellInner, {
        tableId,
        rowId,
        colId,
        rowspan: 1,
        colspan: 1,
      });
      const tableCell = tableCellInner.wrap(blotName.tableCell, {
        tableId,
        rowId,
        colId,
        rowspan: 1,
        colspan: 1,
      });
      tableRow.appendChild(tableCell);
    }
    this.insertBefore(tableRow, rows[targetIndex] || null);
  }

  checkMerge(): boolean {
    const next = this.next as TableBodyFormat;
    return (
      next !== null
      && next.statics.blotName === this.statics.blotName
      && next.tableId === this.tableId
    );
  }

  optimize(context: Record<string, any>) {
    const parent = this.parent;
    if (parent !== null && parent.statics.blotName !== blotName.tableMain) {
      const { tableId } = this;
      this.wrap(blotName.tableMain, { tableId });
    }

    super.optimize(context);
  }
}
