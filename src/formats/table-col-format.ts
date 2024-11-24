import type { Parchment as TypeParchment } from 'quill';
import type { BlockEmbed as TypeBlockEmbed } from 'quill/blots/block';
import type { TableColValue } from '../utils';
import Quill from 'quill';
import { blotName, findParentBlot, findParentBlots } from '../utils';
import { TableCellInnerFormat } from './table-cell-inner-format';

const BlockEmbed = Quill.import('blots/block/embed') as typeof TypeBlockEmbed;

export class TableColFormat extends BlockEmbed {
  static blotName = blotName.tableCol;
  static tagName = 'col';

  static create(value: TableColValue) {
    const { width, tableId, colId, full, align } = value;
    const node = super.create() as HTMLElement;
    node.setAttribute('width', `${Number.parseFloat(width)}${full ? '%' : 'px'}`);
    full && (node.dataset.full = String(full));
    if (align && align !== 'left') {
      node.dataset.align = align;
    }
    node.dataset.tableId = tableId;
    node.dataset.colId = colId;
    node.setAttribute('contenteditable', 'false');
    return node;
  }

  constructor(
    public scroll: TypeParchment.Root,
    public domNode: HTMLElement,
  ) {
    super(scroll, domNode);
  }

  get width(): number {
    const width = this.domNode.getAttribute('width')!;
    return Number.parseFloat(width);
  }

  set width(value: string | number) {
    const width = Number.parseFloat(value as string);
    this.domNode.setAttribute('width', `${width}${this.full ? '%' : 'px'}`);
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

  static value(domNode: HTMLElement) {
    const { tableId, colId } = domNode.dataset;
    const width = domNode.getAttribute('width');
    const align = domNode.dataset.align;
    const full = Object.hasOwn(domNode.dataset, 'full');
    const value: Record<string, any> = {
      tableId,
      colId,
      full,
    };
    width && (value.width = Number.parseFloat(width));
    align && (value.align = align);
    return value;
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

  optimize(context: Record< string, any>) {
    const parent = this.parent;
    if (parent != null && parent.statics.blotName !== blotName.tableColgroup) {
      const value = TableColFormat.value(this.domNode);
      this.wrap(blotName.tableColgroup, value);
    }

    const tableColgroup = findParentBlot(this, blotName.tableColgroup);
    tableColgroup.align = this.align;

    super.optimize(context);
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
