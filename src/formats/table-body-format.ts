import type { Parchment as TypeParchment } from 'quill';
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

  checkMerge(): boolean {
    const next = this.next;
    return (
      next !== null
      && next.statics.blotName === this.statics.blotName
    );
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
    const rowId = randomId();
    const tr = this.scroll.create(blotName.tableRow, rowId) as ContainerFormat;
    for (const colId of insertColIds) {
      const td = this.scroll.create(blotName.tableCell, {
        rowId,
        colId,
        rowspan: 1,
        colspan: 1,
      }) as ContainerFormat;
      const tdInner = this.scroll.create(blotName.tableCellInner, {
        tableId: tableBlot.tableId,
        rowId,
        colId,
        rowspan: 1,
        colspan: 1,
      }) as ContainerFormat;
      const block = this.scroll.create('block') as TypeParchment.BlockBlot;
      block.appendChild(this.scroll.create('break'));
      tdInner.appendChild(block);
      td.appendChild(tdInner);
      tr.appendChild(td);
    }
    this.insertBefore(tr, rows[targetIndex] || null);
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
