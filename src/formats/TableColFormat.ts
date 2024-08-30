import Quill from 'quill';
import type { Parchment as TypeParchment } from 'quill';
import type { TableColValue } from '../utils';
import { blotName } from '../utils';
import type { TableMainFormat } from './TableMainFormat';
import { ContainerFormat } from './ContainerFormat';

// const Break = Quill.import('blots/break') as TypeParchment.BlotConstructor;
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

  set width(value: string) {
    const width = Number.parseFloat(value);
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

  formats() {
    const { tableId, colId } = this;
    return {
      [this.statics.blotName]: {
        tableId,
        colId,
        width: this.domNode.getAttribute('width'),
        full: Object.hasOwn(this.domNode.dataset, 'full'),
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
    if (parent != null && parent.statics.blotName !== blotName.tableColGroup) {
      const marker = this.scroll.create('block');
      this.parent.insertBefore(marker, this.next);

      const tableWrapper = this.scroll.create(blotName.tableWrapper, this.domNode.dataset.tableId) as TypeParchment.ParentBlot;
      const table = this.scroll.create(blotName.tableMain, this.domNode.dataset.tableId) as TableMainFormat;
      this.full && (table.full = true);
      const tableColgroup = this.scroll.create(blotName.tableColGroup) as TypeParchment.ParentBlot; ;

      tableColgroup.appendChild(this);
      table.appendChild(tableColgroup);
      tableWrapper.appendChild(table);
      tableWrapper.replaceWith(marker);
    }
    super.optimize(context);
  }
}
