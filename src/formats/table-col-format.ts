import type { Parchment as TypeParchment } from 'quill';
import type { BlockEmbed as TypeBlockEmbed } from 'quill/blots/block';
import type { TableColValue } from '../utils';
import Quill from 'quill';
import { blotName, findParentBlot, findParentBlots, tableUpSize } from '../utils';
import { TableCellInnerFormat } from './table-cell-inner-format';

const BlockEmbed = Quill.import('blots/block/embed') as typeof TypeBlockEmbed;

export class TableColFormat extends BlockEmbed {
  static blotName = blotName.tableCol;
  static tagName = 'col';

  static validWidth(width: string | number, full: boolean) {
    let widthNumber = Number.parseFloat(String(width));
    if (Number.isNaN(widthNumber)) {
      widthNumber = tableUpSize[full ? 'colMinWidthPre' : 'colMinWidthPx'];
    }
    return `${widthNumber}${full ? '%' : 'px'}`;
  }

  static create(value: TableColValue) {
    const { width, tableId, colId, full, align } = value;
    const node = super.create() as HTMLElement;
    node.setAttribute('width', this.validWidth(width, !!full));
    full && (node.dataset.full = String(full));
    if (align && align !== 'left') {
      node.dataset.align = align;
    }
    node.dataset.tableId = tableId;
    node.dataset.colId = colId;
    return node;
  }

  static value(domNode: HTMLElement) {
    const { tableId, colId } = domNode.dataset;
    const width = domNode.getAttribute('width') || String(tableUpSize.colDefaultWidth);
    const align = domNode.dataset.align;
    const full = Object.hasOwn(domNode.dataset, 'full');
    const value: Record<string, any> = {
      tableId: String(tableId),
      colId: String(colId),
      full,
      width: Number.parseFloat(width),
    };
    align && (value.align = align);
    return value;
  }

  get width(): number {
    let width: number | string | null = this.domNode.getAttribute('width');
    if (!width) {
      width = this.domNode.getBoundingClientRect().width;
      if (this.full) {
        const table = this.domNode.closest('table');
        if (!table) return tableUpSize[this.full ? 'colMinWidthPre' : 'colMinWidthPx'];
        return width / 100 * table.getBoundingClientRect().width;
      }
      return width;
    }
    return Number.parseFloat(String(width));
  }

  set width(value: string | number) {
    let width = Number.parseFloat(String(value));
    if (Number.isNaN(width)) {
      width = tableUpSize[this.full ? 'colMinWidthPre' : 'colMinWidthPx'];
    }
    this.domNode.setAttribute('width', this.statics.validWidth(width, !!this.full));
  }

  get tableId() {
    return this.domNode.dataset.tableId!;
  }

  get colId() {
    return this.domNode.dataset.colId!;
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

  checkMerge(): boolean {
    const next = this.next as TableColFormat;
    const { tableId, colId } = this;
    return (
      next !== null
      && next.statics.blotName === this.statics.blotName
      && next.tableId === tableId
      && next.colId === colId
    );
  }

  optimize(context: Record<string, any>) {
    const parent = this.parent;
    if (parent != null && parent.statics.blotName !== blotName.tableColgroup) {
      const value = this.statics.value(this.domNode);
      this.wrap(blotName.tableColgroup, value);
    }

    const tableColgroup = findParentBlot(this, blotName.tableColgroup);
    tableColgroup.align = this.align;

    if (this.next != null && this.checkMerge()) {
      this.next.remove();
    }

    super.optimize(context);

    try {
      const tableColgroup = findParentBlot(this, blotName.tableColgroup);
      let isAllFull = true;
      // eslint-disable-next-line unicorn/no-array-for-each
      tableColgroup.children.forEach((col) => {
        isAllFull &&= col.full;
      });
      tableColgroup.full = isAllFull;
    }
    catch {}
  }

  insertAt(index: number, value: string, def?: any): void {
    if (def != null) {
      super.insertAt(index, value, def);
      return;
    }
    const lines = value.split('\n');
    const text = lines.pop();
    const blocks = lines.map((line) => {
      const block = this.scroll.create('block');
      block.insertAt(0, line);
      return block;
    });
    const ref = this.split(index);
    const [tableColgroupBlot, tableMainBlot] = findParentBlots(this, [blotName.tableColgroup, blotName.tableMain] as const);
    const tableBodyBlot = tableColgroupBlot.next;
    if (ref) {
      const index = ref.offset(tableColgroupBlot);
      tableColgroupBlot.split(index);
    }
    // create tbody
    let insertBlot = tableMainBlot.parent.parent;
    let nextBlotRef: TypeParchment.Blot | null = tableMainBlot.parent.next;
    if (tableBodyBlot) {
      const cellInners = tableBodyBlot.descendants(TableCellInnerFormat);
      if (cellInners.length > 0) {
        const cellInnerBlot = cellInners[0];
        const value = TableCellInnerFormat.formats(cellInnerBlot.domNode);
        const newBlock = this.scroll.create('block') as TypeParchment.BlockBlot;
        const newTableCellInner = newBlock.wrap(blotName.tableCellInner, value);
        const newTableCell = newTableCellInner.wrap(blotName.tableCell, value);
        const newTableRow = newTableCell.wrap(blotName.tableRow, value);
        const newTableBody = newTableRow.wrap(blotName.tableBody, value.tableId);
        tableColgroupBlot.parent.insertBefore(newTableBody, tableColgroupBlot.next);

        insertBlot = newBlock;
        nextBlotRef = newBlock.next;
      }
    }

    for (const block of blocks) {
      insertBlot.insertBefore(block, nextBlotRef);
    }
    if (text) {
      insertBlot.insertBefore(this.scroll.create('text', text), nextBlotRef);
    }
  }
}
