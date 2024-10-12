import type { Parchment as TypeParchment } from 'quill';
import type { TableCellValue } from '../utils';
import type { TableCellFormat } from './table-cell-format';
import Quill from 'quill';
import { blotName, findParentBlot, findParentBlots } from '../utils';
import { ContainerFormat } from './container-format';

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
    height && (node.dataset.height = height);
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
    this.parent && (this.parent.rowId = value);
    this.setFormatValue('row-id', value);
  }

  get colId() {
    return this.domNode.dataset.colId!;
  }

  set colId(value) {
    this.parent && (this.parent.colId = value);
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

  set backgroundColor(value: string | null) {
    this.parent && (this.parent.backgroundColor = value);
    this.setFormatValue('background-color', value);
  }

  get height() {
    return this.domNode.dataset.height || '';
  }

  set height(value: string) {
    this.parent && (this.parent.height = value);
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
    height && (value.height = height);
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
      // when insert delta like: [ { attributes: { 'table-up-cell-inner': { ... } }, insert: '\n' }, { attributes: { 'table-up-cell-inner': { ... } }, insert: '\n' }, ...]
      // that delta will create dom like: <td><div></div></td>... . that means TableCellInner will be an empty cell without 'block'
      // in this case, a 'block' should to inserted to makesure that the cell will not be remove
      if (this.children.length === 0) {
        const block = this.scroll.create('block') as TypeParchment.BlockBlot;
        block.appendChild(this.scroll.create('break'));
        this.appendChild(block);
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
      const cellInnerBlotValue: Record<string, any> = {
        tableId: cellInnerBlot.tableId,
        rowId: cellInnerBlot.rowId,
        colId: cellInnerBlot.colId,
        rowspan: cellInnerBlot.rowspan,
        colspan: cellInnerBlot.colspan,
        backgroundColor: cellInnerBlot.backgroundColor,
        height: cellInnerBlot.height,
      };
      const selfValue: Record<string, any> = {
        tableId: this.tableId,
        rowId: this.rowId,
        colId: this.colId,
        rowspan: this.rowspan,
        colspan: this.colspan,
        backgroundColor: this.backgroundColor,
        height: this.height,
      };
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
          const newCell = cellInnerBlot.wrap(blotName.tableCell, cellInnerBlotValue);
          return selfRow.parent.insertBefore(newCell.wrap(blotName.tableRow, cellInnerBlotValue), selfRow.next);
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
