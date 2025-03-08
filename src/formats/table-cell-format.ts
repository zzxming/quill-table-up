import type { TableCellValue } from '../utils';
import type { TableRowFormat } from './table-row-format';
import { blotName, findParentBlot } from '../utils';
import { ContainerFormat } from './container-format';
import { TableCellInnerFormat } from './table-cell-inner-format';
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
      if (name.startsWith('border')) {
        this.setStyleBoder(name, value);
      }
    }
  }

  setStyleBoder(name: string, value?: any) {
    // eslint-disable-next-line no-extra-boolean-cast
    const setValue = Boolean(value) ? value : null;
    const isMergeBorder = !['left', 'right', 'top', 'bottom'].some(direction => name.includes(direction)) && name.startsWith('border-');
    if (!isMergeBorder) return;

    // only need set prev td. event current td is a span cell
    if (this.prev && this.prev instanceof TableCellFormat) {
      const [cell] = this.prev.descendant(TableCellInnerFormat, 0);
      if (cell) {
        cell.setFormatValue(name.replace('border-', 'border-right-'), setValue, true);
      }
    }

    // need find all the prev td that bottom near current td
    if (this.parent.prev) {
      try {
        const tableMainBlot = findParentBlot(this, blotName.tableMain);
        const colIds = tableMainBlot.getColIds();
        const startColIndex = this.getColumnIndex();
        const endColIndex = startColIndex + this.colspan;
        const borderColIds = new Set(colIds.filter((_, i) => i >= startColIndex && i < endColIndex));

        let rowspan = 1;
        let prevTr = this.parent.prev as TableRowFormat;
        while (prevTr) {
          let trReachCurrent = false;
          prevTr.foreachCellInner((cell) => {
            if (borderColIds.has(cell.colId) && cell.rowspan >= rowspan) {
              cell.setFormatValue(name.replace('border-', 'border-bottom-'), setValue, true);
              borderColIds.delete(cell.colId);
            }

            cell.rowspan >= rowspan && (trReachCurrent = true);
          });
          if (!trReachCurrent) break;
          prevTr = prevTr.prev as TableRowFormat;
          rowspan += 1;
        }
      }
      catch (error) {
        console.error(error);
      }
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

  getColumnIndex() {
    const table = findParentBlot(this, blotName.tableMain);
    return table.getColIds().indexOf(this.colId);
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
