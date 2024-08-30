import Quill from 'quill';
import type { Parchment as TypeParchment } from 'quill';
import type { TableCellValue } from '../utils';
import { blotName } from '../utils';
import { ContainerFormat } from './ContainerFormat';

const Block = Quill.import('blots/block') as TypeParchment.BlotConstructor;

export class TableCellInnerFormat extends ContainerFormat {
  static blotName = blotName.tableCellInner;
  static tagName = 'p';
  static className = 'ql-table-cell-inner';

  static defaultChild: TypeParchment.BlotConstructor = Block;

  static create(value: TableCellValue) {
    const { tableId, rowId, colId, rowspan, colspan } = value;
    const node = super.create() as HTMLElement;
    node.dataset.tableId = tableId;
    node.dataset.rowId = rowId;
    node.dataset.colId = colId;
    node.dataset.rowspan = String(rowspan || 1);
    node.dataset.colspan = String(colspan || 1);
    return node;
  }

  constructor(
    public scroll: TypeParchment.Root,
    public domNode: HTMLElement,
  ) {
    super(scroll, domNode);
  }

  // this issue also effect TableColFormat
  // make sure cell have at least one length. Otherwise will get wrong insert index when table inserting
  // when inserting cell not have defaultChild. that mean TableCellInnerFormat.length() === 0
  // quill2.x deleted replace method. if not want rewrite method length. need to rewrite method Block.repalceWith
  // rewrite: when replacement instanceof ParentBlot. change moveChildren to wrap
  // but length() >= 1 maybe have some bugs. if have bug. change Container to Block
  length(): number {
    return super.length() + 1;
  }

  get tableId() {
    return this.domNode.dataset.tableId!;
  }

  get rowId() {
    return this.domNode.dataset.rowId!;
  }

  set rowId(value) {
    this.parent && ((this.parent as any).rowId = value);
    this.domNode.dataset.rowId = value;
  }

  get colId() {
    return this.domNode.dataset.colId!;
  }

  set colId(value) {
    this.parent && ((this.parent as any).colId = value);
    this.domNode.dataset.colId = value;
  }

  get rowspan() {
    return Number(this.domNode.dataset.rowspan);
  }

  set rowspan(value: number) {
    this.parent && ((this.parent as any).rowspan = value);
    this.domNode.dataset.rowspan = String(value);
  }

  get colspan() {
    return Number(this.domNode.dataset.colspan);
  }

  set colspan(value: number) {
    this.parent && ((this.parent as any).colspan = value);
    this.domNode.dataset.colspan = String(value);
  }

  // getColumnIndex() {
  //   const table = findParentBlot<any>(this, blotName.table);
  //   return table.getColIds().indexOf(this.colId);
  // }

  // replaceWith(target: Blot | string, value?: any) {
  //   console.log('reapl', target, value);
  //   const replacement = typeof target === 'string' ? this.scroll.create(target, value) : target;
  //   if (replacement.statics.blotName !== this.statics.blotName) {
  //     const cloneTarget = replacement.clone() as ContainerBlot;
  //     (replacement as ContainerBlot).moveChildren(cloneTarget);
  //     this.appendChild(cloneTarget);
  //     replacement.parent.insertBefore(this, replacement.next);
  //     replacement.remove();
  //     return this;
  //   }
  //   else {
  //     return super.replaceWith(target, value);
  //   }
  // }

  formats() {
    const { tableId, rowId, colId, rowspan, colspan } = this;
    return {
      [this.statics.blotName]: {
        tableId,
        rowId,
        colId,
        rowspan,
        colspan,
      },
    };
  }

  optimize(context: Record< string, any>) {
    const parent = this.parent;
    // 父级非表格，则将当前 blot 放入表格中
    const { tableId, colId, rowId, rowspan, colspan } = this;
    if (parent !== null && parent.statics.blotName !== blotName.tableCell) {
      // insert a mark blot to make sure table insert index
      const marker = this.scroll.create('block');
      parent.insertBefore(marker, this.next);

      const tableWrapper = this.scroll.create(blotName.tableWrapper, tableId) as TypeParchment.ParentBlot;
      const table = this.scroll.create(blotName.tableMain, tableId) as TypeParchment.ParentBlot;
      const tableBody = this.scroll.create(blotName.tableBody) as TypeParchment.ParentBlot;
      const tr = this.scroll.create(blotName.tableRow, rowId) as TypeParchment.ParentBlot;
      const td = this.scroll.create(blotName.tableCell, {
        tableId,
        rowId,
        colId,
        rowspan,
        colspan,
      }) as TypeParchment.ParentBlot;

      td.appendChild(this);
      tr.appendChild(td);
      tableBody.appendChild(tr);
      table.appendChild(tableBody);
      tableWrapper.appendChild(table);
      tableWrapper.replaceWith(marker);
    }

    super.optimize(context);
  }
}
