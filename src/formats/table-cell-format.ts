import type { TableCellValue } from '../utils';
import type { TableRowFormat } from './table-row-format';
import { blotName } from '../utils';
import { ContainerFormat } from './container-format';
import { TableCellInnerFormat } from './table-cell-inner-format';

export class TableCellFormat extends ContainerFormat {
  static blotName = blotName.tableCell;
  static tagName = 'td';
  static className = 'ql-table-cell';

  static create(value: TableCellValue) {
    const { tableId, rowId, colId, rowspan, colspan, backgroundColor, borderColor, height } = value;
    const node = super.create() as HTMLElement;
    node.dataset.tableId = tableId;
    node.dataset.rowId = rowId;
    node.dataset.colId = colId;
    node.setAttribute('rowspan', String(rowspan || 1));
    node.setAttribute('colspan', String(colspan || 1));
    height && (node.style.height = height);
    backgroundColor && (node.style.backgroundColor = backgroundColor);
    borderColor && (node.style.borderColor = borderColor);
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
      rowspan,
      colspan,
    };
    const { height, backgroundColor, borderColor } = domNode.style;
    height && (value.height = height);
    backgroundColor && (value.backgroundColor = backgroundColor);
    borderColor && (value.borderColor = borderColor);
    return value;
  }

  allowDataAttrs = new Set(['table-id', 'row-id', 'col-id']);
  allowAttrs = new Set(['rowspan', 'colspan']);
  allowStyle = new Set(['background-color', 'border-color', 'height']);
  setFormatValue(name: string, value?: any) {
    if (this.allowAttrs.has(name) || this.allowDataAttrs.has(name)) {
      let attrName = name;
      if (this.allowDataAttrs.has(name)) {
        attrName = `data-${name}`;
      }
      if (value) {
        this.domNode.setAttribute(attrName, value);
      }
      else {
        this.domNode.removeAttribute(attrName);
      }
    }
    else if (this.allowStyle.has(name)) {
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

  get backgroundColor() {
    return this.domNode.dataset.backgroundColor || '';
  }

  get height() {
    return this.domNode.style.height;
  }

  getCellInner() {
    return this.descendants(TableCellInnerFormat)[0];
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
