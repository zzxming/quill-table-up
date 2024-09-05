import Quill from 'quill';
import type { Parchment as TypeParchment } from 'quill';
import type { TableColValue } from '../utils';
import { blotName } from '../utils';
import type { TableMainFormat } from './table-main-format';
import { ContainerFormat } from './container-format';

const Block = Quill.import('blots/block') as TypeParchment.BlotConstructor;
// const BlockEmbed = Quill.import('blots/block/embed') as TypeParchment.BlotConstructor;

// if can make sure user won't focus in col. use BlockEmbed is better
export class TableColFormat extends ContainerFormat {
  static blotName = blotName.tableCol;
  static tagName = 'col';

  static defaultChild: TypeParchment.BlotConstructor = Block;
  length(): number {
    return 1;
  }

  static create(value: TableColValue) {
    const { width, tableId, colId, full } = value;
    const node = super.create() as HTMLElement;
    node.setAttribute('width', `${Number.parseFloat(width)}${full ? '%' : 'px'}`);
    full && (node.dataset.full = String(full));
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
    this.clearDeltaCache();
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

  formats() {
    const { tableId, colId, width, full } = this;
    return {
      [this.statics.blotName]: {
        tableId,
        colId,
        width,
        full,
      },
    };
  }

  checkMerge(): boolean {
    const next = this.next;
    const { tableId, colId } = this;
    return (
      next !== null
      && next.statics.blotName === this.statics.blotName
      && (next.domNode as HTMLElement).dataset.tableId === tableId
      && (next.domNode as HTMLElement).dataset.colId === colId
    );
  }

  optimize(context: Record< string, any>) {
    const parent = this.parent;
    if (parent != null && parent.statics.blotName !== blotName.tableColgroup) {
      const marker = this.scroll.create('block');
      this.parent.insertBefore(marker, this.next);
      const tableWrapper = this.scroll.create(blotName.tableWrapper, this.tableId) as TypeParchment.ParentBlot;
      const table = this.scroll.create(blotName.tableMain, this.tableId) as TableMainFormat;
      this.full && (table.full = true);
      const tableColgroup = this.scroll.create(blotName.tableColgroup) as TypeParchment.ParentBlot;

      tableColgroup.appendChild(this);
      table.appendChild(tableColgroup);
      tableWrapper.appendChild(table);
      marker.replaceWith(tableWrapper);
    }
    super.optimize(context);
  }
}
