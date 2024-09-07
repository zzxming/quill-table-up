import Quill from 'quill';
import type { Parchment as TypeParchment } from 'quill';
import { blotName, findParentBlot } from '../utils';
import type { TableCellValue } from '../utils';
import { ContainerFormat } from './container-format';
import type { TableCellFormat } from './table-cell-format';

const Block = Quill.import('blots/block') as TypeParchment.BlotConstructor;
const BlockEmbed = Quill.import('blots/block/embed') as TypeParchment.BlotConstructor;

export class TableCellInnerFormat extends ContainerFormat {
  static blotName = blotName.tableCellInner;
  static tagName = 'div';
  static className = 'ql-table-cell-inner';

  static defaultChild: TypeParchment.BlotConstructor = Block;

  static create(value: TableCellValue) {
    const { tableId, rowId, colId, rowspan, colspan, backgroundColor, height } = value;
    const node = super.create() as HTMLElement;
    node.dataset.tableId = tableId;
    node.dataset.rowId = rowId;
    node.dataset.colId = colId;
    node.dataset.rowspan = String(rowspan || 1);
    node.dataset.colspan = String(colspan || 1);
    height && height > 0 && (node.dataset.height = String(height));
    backgroundColor && (node.dataset.backgroundColor = backgroundColor);
    return node;
  }

  declare parent: TableCellFormat;

  allowDataAttrs: Set<string> = new Set(['table-id', 'row-id', 'col-id', 'rowspan', 'colspan', 'background-color', 'height']);
  setFormatValue(name: string, value: any) {
    if (!this.allowDataAttrs.has(name)) return;
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
    this.parent && (this.parent.rowspan = value);
    this.setFormatValue('rowspan', value);
  }

  get colspan() {
    return Number(this.domNode.dataset.colspan);
  }

  set colspan(value: number) {
    this.parent && (this.parent.colspan = value);
    this.setFormatValue('colspan', value);
  }

  get backgroundColor() {
    return this.domNode.dataset.backgroundColor || '';
  }

  set backgroundColor(value: string) {
    this.parent && (this.parent.backgroundColor = value);
    this.setFormatValue('background-color', value);
  }

  get height() {
    return Number(this.domNode.dataset.height) || 0;
  }

  set height(value: number) {
    this.parent && (this.parent.height = Number(value));
    this.setFormatValue('height', value);
  }

  getColumnIndex() {
    const table = findParentBlot(this, blotName.tableMain);
    return table.getColIds().indexOf(this.colId);
  }

  formatAt(index: number, length: number, name: string, value: any) {
    if (this.children.length === 0) {
      this.appendChild(this.scroll.create(this.statics.defaultChild.blotName));
      // block min length is 1
      length += 1;
    }
    super.formatAt(index, length, name, value);
  }

  formats(): Record<string, any> {
    const { tableId, rowId, colId, rowspan, colspan, backgroundColor, height } = this;
    const value: Record<string, any> = {
      tableId,
      rowId,
      colId,
      rowspan,
      colspan,
    };
    height !== 0 && (value.height = height);
    backgroundColor && (value.backgroundColor = backgroundColor);
    return {
      [this.statics.blotName]: value,
    };
  }

  optimize(context: Record< string, any>) {
    const parent = this.parent;
    const { tableId, colId, rowId, rowspan, colspan, backgroundColor, height } = this;
    // handle BlockEmbed to insert tableCellInner when setContents
    if (this.prev && this.prev instanceof BlockEmbed) {
      const afterBlock = this.scroll.create('block');
      this.appendChild(this.prev);
      this.appendChild(afterBlock);
    }
    if (parent !== null && parent.statics.blotName !== blotName.tableCell) {
      // insert a mark blot to make sure table insert index
      const marker = this.scroll.create('block');
      parent.insertBefore(marker, this.next);

      const tableWrapper = this.scroll.create(blotName.tableWrapper, tableId) as ContainerFormat;
      const table = this.scroll.create(blotName.tableMain, tableId) as ContainerFormat;
      const tableBody = this.scroll.create(blotName.tableBody) as ContainerFormat;
      const tr = this.scroll.create(blotName.tableRow, rowId) as ContainerFormat;
      const td = this.scroll.create(blotName.tableCell, {
        tableId,
        rowId,
        colId,
        rowspan,
        colspan,
        backgroundColor,
        height,
      }) as ContainerFormat;

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
