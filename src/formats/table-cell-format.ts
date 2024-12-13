import type { TableCellValue } from '../utils';
import type { TableCellInnerFormat } from './table-cell-inner-format';
import type { TableRowFormat } from './table-row-format';
import { blotName } from '../utils';
import { ContainerFormat } from './container-format';
import { getValidCellspan } from './utils';

export class TableCellFormat extends ContainerFormat {
  static blotName = blotName.tableCell;
  static tagName = 'td';
  static className = 'ql-table-cell';
  static allowDataAttrs = new Set(['table-id', 'row-id', 'col-id']);
  static allowAttrs = new Set(['rowspan', 'colspan']);

  // keep `isAllowStyle` and `allowStyle` same with TableCellInnerFormat
  static allowStyle = new Set(['background-color', 'border', 'height']);
  static isAllowStyle(str: string): boolean {
    for (const style of this.allowStyle) {
      if (str.startsWith(style)) {
        return true;
      }
    }
    return false;
  }

  static create(value: TableCellValue) {
    const {
      tableId,
      rowId,
      colId,
      rowspan,
      colspan,
      style,
    } = value;
    const node = super.create() as HTMLElement;
    node.dataset.tableId = tableId;
    node.dataset.rowId = rowId;
    node.dataset.colId = colId;
    node.setAttribute('rowspan', String(getValidCellspan(rowspan)));
    node.setAttribute('colspan', String(getValidCellspan(colspan)));
    style && (node.style.cssText = style);
    return node;
  }

  static formats(domNode: HTMLElement) {
    const { tableId, rowId, colId } = domNode.dataset;
    const rowspan = Number(domNode.getAttribute('rowspan'));
    const colspan = Number(domNode.getAttribute('colspan'));
    const value: Record<string, any> = {
      tableId,
      rowId,
      colId,
      rowspan: getValidCellspan(rowspan),
      colspan: getValidCellspan(colspan),
    };

    const inlineStyles: Record<string, any> = {};
    for (let i = 0; i < domNode.style.length; i++) {
      const property = domNode.style[i];
      const value = domNode.style[property as keyof CSSStyleDeclaration] as string;
      if (this.isAllowStyle(String(property)) && !['initial', 'inherit'].includes(value)) {
        inlineStyles[property] = value;
      }
    }
    const entries = Object.entries(inlineStyles);
    if (entries.length > 0) {
      value.style = entries.map(([key, value]) => `${key}:${value}`).join(';');
    }

    return value;
  }

  setFormatValue(name: string, value?: any) {
    if (this.statics.allowAttrs.has(name) || this.statics.allowDataAttrs.has(name)) {
      let attrName = name;
      if (this.statics.allowDataAttrs.has(name)) {
        attrName = `data-${name}`;
      }
      if (value) {
        this.domNode.setAttribute(attrName, value);
      }
      else {
        this.domNode.removeAttribute(attrName);
      }
    }
    else if (this.statics.isAllowStyle(name)) {
      Object.assign(this.domNode.style, {
        [name]: value,
      });
    }
  }

  get tableId() {
    return this.domNode.dataset.tableId!;
  }

  get rowId() {
    return this.domNode.dataset.rowId!;
  }

  get colId() {
    return this.domNode.dataset.colId!;
  }

  get rowspan() {
    return Number(this.domNode.getAttribute('rowspan'));
  }

  get colspan() {
    return Number(this.domNode.getAttribute('colspan'));
  }

  getCellInner() {
    return this.children.head as TableCellInnerFormat;
  }

  checkMerge(): boolean {
    const { colId, rowId, colspan, rowspan } = this;
    const next = this.next as TableCellFormat;
    return (
      next !== null
      && next.statics.blotName === this.statics.blotName
      && next.rowId === rowId
      && next.colId === colId
      && next.colspan === colspan
      && next.rowspan === rowspan
    );
  }

  optimize(context: Record<string, any>) {
    const parent = this.parent as TableRowFormat;
    const { tableId, rowId } = this;
    if (parent !== null && parent.statics.blotName !== blotName.tableRow) {
      this.wrap(blotName.tableRow, { tableId, rowId });
    }

    super.optimize(context);
  }
}
