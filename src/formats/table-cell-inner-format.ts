import Quill from 'quill';
import type { Parchment as TypeParchment } from 'quill';
import type TypeBlock from 'quill/blots/block';
import { blotName, findParentBlot } from '../utils';
import type { TableCellValue } from '../utils';
import { ContainerFormat } from './container-format';
import type { TableMainFormat } from './table-main-format';
import type { TableCellFormat } from './table-cell-format';

const Block = Quill.import('blots/block') as TypeParchment.BlotConstructor;

export class TableCellInnerFormat extends ContainerFormat {
  static blotName = blotName.tableCellInner;
  static tagName = 'p';
  static className = 'ql-table-cell-inner';

  static defaultChild: TypeParchment.BlotConstructor = Block;

  static create(value: TableCellValue) {
    const { tableId, rowId, colId, rowspan, colspan, backgroundColor } = value;
    const node = super.create() as HTMLElement;
    node.dataset.tableId = tableId;
    node.dataset.rowId = rowId;
    node.dataset.colId = colId;
    node.dataset.rowspan = String(rowspan || 1);
    node.dataset.colspan = String(colspan || 1);
    backgroundColor && (node.dataset.backgroundColor = backgroundColor);
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

  clearDeltaCache() {
    // eslint-disable-next-line unicorn/no-array-for-each
    this.children.forEach((child) => {
      (child as TypeBlock).cache = {};
    });
  }

  attributesList: Set<string> = new Set(['table-id', 'row-id', 'col-id', 'rowspan', 'colspan', 'background-color']);
  setFormatValue(name: string, value: any) {
    if (!this.attributesList.has(name)) return;
    const attrName = `data-${name}`;
    if (value) {
      this.domNode.setAttribute(attrName, value);
    }
    else {
      this.domNode.removeAttribute(attrName);
    }
    this.clearDeltaCache();
  }

  get tableId() {
    return this.domNode.dataset.tableId!;
  }

  get rowId() {
    return this.domNode.dataset.rowId!;
  }

  set rowId(value) {
    this.parent && ((this.parent as any).rowId = value);
    this.setFormatValue('row-id', value);
  }

  get colId() {
    return this.domNode.dataset.colId!;
  }

  set colId(value) {
    this.parent && ((this.parent as any).colId = value);
    this.setFormatValue('col-id', value);
  }

  get rowspan() {
    return Number(this.domNode.dataset.rowspan);
  }

  set rowspan(value: number) {
    this.parent && ((this.parent as TableCellFormat).rowspan = value);
    this.setFormatValue('rowspan', value);
  }

  get colspan() {
    return Number(this.domNode.dataset.colspan);
  }

  set colspan(value: number) {
    this.parent && ((this.parent as TableCellFormat).colspan = value);
    this.setFormatValue('colspan', value);
  }

  get backgroundColor() {
    return this.domNode.dataset.backgroundColor || '';
  }

  set backgroundColor(value: string) {
    this.parent && ((this.parent as TableCellFormat).backgroundColor = value);
    this.setFormatValue('background-color', value);
  }

  getColumnIndex() {
    const table = findParentBlot<TableMainFormat>(this, blotName.tableMain);
    return table.getColIds().indexOf(this.colId);
  }

  formats() {
    const { tableId, rowId, colId, rowspan, colspan, backgroundColor } = this;
    const value: Record<string, any> = {
      tableId,
      rowId,
      colId,
      rowspan,
      colspan,
    };
    backgroundColor && (value.backgroundColor = backgroundColor);
    return {
      [this.statics.blotName]: value,
    };
  }

  optimize(context: Record< string, any>) {
    const parent = this.parent;
    const { tableId, colId, rowId, rowspan, colspan, backgroundColor } = this;
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
        backgroundColor,
      }) as TypeParchment.ParentBlot;

      td.appendChild(this);
      tr.appendChild(td);
      tableBody.appendChild(tr);
      table.appendChild(tableBody);
      tableWrapper.appendChild(table);
      marker.replaceWith(tableWrapper);
    }

    super.optimize(context);
  }
}
