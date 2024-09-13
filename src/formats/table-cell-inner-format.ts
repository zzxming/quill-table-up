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

  optimize() {
    const parent = this.parent;
    const { tableId, colId, rowId, rowspan, colspan, backgroundColor, height } = this;
    // handle BlockEmbed to insert tableCellInner when setContents
    if (this.prev && this.prev instanceof BlockEmbed) {
      const afterBlock = this.scroll.create('block');
      this.appendChild(this.prev);
      this.appendChild(afterBlock);
    }
    if (parent !== null && parent.statics.blotName !== blotName.tableCell) {
      this.wrap(blotName.tableCell, { tableId, colId, rowId, rowspan, colspan, backgroundColor, height });
    }

    if (this.children.length > 0 && this.next != null && this.checkMerge()) {
      this.next.moveChildren(this);
      this.next.remove();
    }
    // is necessary?
    // if (this.uiNode != null && this.uiNode !== this.domNode.firstChild) {
    //   this.domNode.insertBefore(this.uiNode, this.domNode.firstChild);
    // }
    // if (this.children.length === 0) {
    //   // if cellInner doesn't have child then remove it. not insert a block
    //   this.remove();
    // }
  }

  insertBefore(blot: TypeParchment.Blot, ref?: TypeParchment.Blot | null) {
    if (blot.statics.blotName === this.statics.blotName) {
      const cellInnerBlot = blot as TableCellInnerFormat;
      const cellInnerBlotValue = cellInnerBlot.formats()[this.statics.blotName];
      const selfValue = this.formats()[this.statics.blotName];
      const isSame = Object.entries(selfValue).every(([key, value]) => value === cellInnerBlotValue[key]);
      if (!isSame) {
        const selfRow = findParentBlot(this, blotName.tableRow);
        return selfRow.insertBefore(blot.wrap(blotName.tableCell, cellInnerBlotValue), ref ? this.parent : this.parent.next);
      }
      else {
        cellInnerBlot.moveChildren(this);
      }
    }
    super.insertBefore(blot, ref);
  }
}
