import type { Parchment as TypeParchment } from 'quill';
import type TypeBlock from 'quill/blots/block';
import type { TableCellValue } from '../utils';
import type { TableCellFormat } from './table-cell-format';
import Quill from 'quill';
import { blotName, cssTextToObject, findParentBlot, findParentBlots } from '../utils';
import { ContainerFormat } from './container-format';
import { getValidCellspan } from './utils';

const Block = Quill.import('blots/block') as TypeParchment.BlotConstructor;
const BlockEmbed = Quill.import('blots/block/embed') as TypeParchment.BlotConstructor;

export class TableCellInnerFormat extends ContainerFormat {
  static blotName = blotName.tableCellInner;
  static tagName = 'div';
  static className = 'ql-table-cell-inner';
  static allowDataAttrs: Set<string> = new Set(['table-id', 'row-id', 'col-id', 'rowspan', 'colspan']);
  static defaultChild: TypeParchment.BlotConstructor = Block;
  declare parent: TableCellFormat;
  // keep `isAllowStyle` and `allowStyle` same with TableCellFormat
  static allowStyle = new Set(['background-color', 'border', 'height']);
  static writable: boolean = true;
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
    node.dataset.rowspan = String(getValidCellspan(rowspan));
    node.dataset.colspan = String(getValidCellspan(colspan));
    style && (node.dataset.style = style);
    node.setAttribute('contenteditable', String(this.writable));
    return node;
  }

  static formats(domNode: HTMLElement) {
    const { tableId, rowId, colId, rowspan, colspan, style } = domNode.dataset;
    const value: Record<string, any> = {
      tableId,
      rowId,
      colId,
      rowspan: Number(getValidCellspan(rowspan)),
      colspan: Number(getValidCellspan(colspan)),
    };
    style && (value.style = style);
    return value;
  }

  setFormatValue(name: string, value: any, isStyle: boolean = false) {
    if (isStyle) {
      if (!this.statics.isAllowStyle(name)) return;
      if (this.parent && this.parent.statics.blotName === blotName.tableCell) {
        this.parent.setFormatValue(name, value);
      }
    }
    else {
      if (!this.statics.allowDataAttrs.has(name)) return;
      const attrName = `data-${name}`;
      if (value) {
        this.domNode.setAttribute(attrName, value);
      }
      else {
        this.domNode.removeAttribute(attrName);
      }
      if (this.parent && this.parent.statics.blotName === blotName.tableCell) {
        this.parent.setFormatValue(name, value);
      }
    }

    const blocks = this.descendants(Block, 0);
    for (const child of blocks) {
      (child as TypeBlock).cache = {};
    }
  }

  get tableId() {
    return this.domNode.dataset.tableId!;
  }

  get rowId() {
    return this.domNode.dataset.rowId!;
  }

  set rowId(value) {
    this.setFormatValue('row-id', value);
  }

  get colId() {
    return this.domNode.dataset.colId!;
  }

  set colId(value) {
    this.setFormatValue('col-id', value);
  }

  get rowspan() {
    return Number(this.domNode.dataset.rowspan);
  }

  set rowspan(value: number) {
    this.setFormatValue('rowspan', value);
  }

  get colspan() {
    return Number(this.domNode.dataset.colspan);
  }

  set colspan(value: number) {
    this.setFormatValue('colspan', value);
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
    // set style for `td`
    if (value && value.style) {
      const style = cssTextToObject(value.style);
      for (const [name, value] of Object.entries(style)) {
        this.setFormatValue(name, value, true);
      }
    }
  }

  formats(): Record<string, any> {
    const value = this.statics.formats(this.domNode);
    return {
      [this.statics.blotName]: value,
    };
  }

  checkMerge(): boolean {
    const { colId, rowId, colspan, rowspan } = this;
    const next = this.next as TableCellInnerFormat;
    return (
      next !== null
      && next.statics.blotName === this.statics.blotName
      && next.rowId === rowId
      && next.colId === colId
      && next.colspan === colspan
      && next.rowspan === rowspan
    );
  }

  optimize() {
    const parent = this.parent;
    const blotValue = this.statics.formats(this.domNode);
    // handle BlockEmbed to insert tableCellInner when setContents
    if (this.prev && this.prev instanceof BlockEmbed) {
      const afterBlock = this.scroll.create('block');
      this.appendChild(this.prev);
      this.appendChild(afterBlock);
    }
    if (parent !== null && parent.statics.blotName !== blotName.tableCell) {
      this.wrap(blotName.tableCell, blotValue);
      // when insert delta like: [ { attributes: { 'table-up-cell-inner': { ... } }, insert: '\n' }, { attributes: { 'table-up-cell-inner': { ... } }, insert: '\n' }, ...]
      // that delta will create dom like: <td><div></div></td>... . that means TableCellInner will be an empty cell without 'block'
      // in this case, a 'block' should to inserted to makesure that the cell will not be remove
      if (this.children.length === 0) {
        const child = this.scroll.create(this.statics.defaultChild.blotName);
        this.appendChild(child);
      }
    }

    if (this.children.length > 0 && this.next != null && this.checkMerge()) {
      this.next.moveChildren(this);
      this.next.remove();
    }
    // TODO: uiNode not test, maybe have bug
    if (this.uiNode != null && this.uiNode !== this.domNode.firstChild) {
      this.domNode.insertBefore(this.uiNode, this.domNode.firstChild);
    }
    // this is necessary when redo or undo. else will delete or insert wrong index
    if (this.children.length === 0) {
      // if cellInner doesn't have child then remove it. not insert a block
      this.remove();
    }
  }

  insertBefore(blot: TypeParchment.Blot, ref?: TypeParchment.Blot | null) {
    if (blot.statics.blotName === this.statics.blotName) {
      const cellInnerBlot = blot as TableCellInnerFormat;
      const cellInnerBlotValue = this.statics.formats(cellInnerBlot.domNode);
      const selfValue = this.statics.formats(this.domNode);
      const isSame = Object.entries(selfValue).every(([key, value]) => value === cellInnerBlotValue[key]);

      if (!isSame) {
        const [selfRow, selfCell] = findParentBlots(this, [blotName.tableRow, blotName.tableCell] as const);
        // split current cellInner
        if (ref) {
          const index = ref.offset();
          const length = this.length();
          if (index + 1 < length) {
            const newCellInner = this.scroll.create(blotName.tableCellInner, selfValue) as TypeParchment.Parent;
            this.children.forEachAt(index + 1, this.length(), (block) => {
              newCellInner.appendChild(block);
            });
            selfRow.insertBefore(newCellInner.wrap(blotName.tableCell, selfValue), selfCell.next);

            if (this.children.length === 0) {
              this.remove();
              if (this.parent.children.length === 0) {
                this.parent.remove();
              }
            }
          }
        }
        // different rowId. split current row. move lines which after ref to next row
        if (this.rowId !== cellInnerBlot.rowId) {
          if (ref) {
            const index = ref.offset(selfRow);
            selfRow.split(index);
          }
          else if (selfCell.next) {
            const index = selfCell.next.offset(selfRow);
            selfRow.split(index);
          }
          const row = this.scroll.create(blotName.tableRow, cellInnerBlotValue) as TypeParchment.Parent;
          const cell = this.scroll.create(blotName.tableCell, cellInnerBlotValue) as TypeParchment.Parent;
          cell.appendChild(cellInnerBlot);
          row.appendChild(cell);
          return selfRow.parent.insertBefore(row, selfRow.next);
        }
        return selfRow.insertBefore(
          cellInnerBlot.wrap(blotName.tableCell, cellInnerBlotValue),
          ref ? selfCell : selfCell.next,
        );
      }
      else {
        return this.parent.insertBefore(cellInnerBlot, this.next);
      }
    }
    super.insertBefore(blot, ref);
  }
}
