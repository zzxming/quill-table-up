import Quill from 'quill';
import type TypeBlock from 'quill/blots/block';
import type { Parchment as TypeParchment } from 'quill';
import { blotName } from '../../utils';
import type { TableCellFormat } from '../table-cell-format';
import type { TableWrapperFormat } from '../table-wrapper-format';
import type { TableRowFormat } from '../table-row-format';

const Parchment = Quill.import('parchment');
const Block = Quill.import('blots/block') as typeof TypeBlock;

export class BlockOverride extends Block {
  replaceWith(name: string | TypeParchment.Blot, value?: any): TypeParchment.Blot {
    const replacement = typeof name === 'string' ? this.scroll.create(name, value) : name;
    if (replacement instanceof Parchment.ParentBlot) {
      // replace block to TableCellInner length is 0 when setContents
      // that will set text direct in TableCellInner but not in block
      // so we need to set text in block and block in TableCellInner
      // wrap with TableCellInner.formatAt when length is 0 will create a new block
      // that can make sure TableCellInner struct correctly
      if (replacement.statics.blotName === blotName.tableCellInner) {
        const selfParent = this.parent;
        if (selfParent.statics.blotName === blotName.tableCellInner) {
          if (selfParent != null) {
            selfParent.insertBefore(replacement, this.prev ? null : this.next);
          }
          if (this.parent.statics.blotName === blotName.tableCellInner && this.prev) {
            // eslint-disable-next-line unicorn/no-this-assignment, ts/no-this-alias
            let block: TypeBlock | null = this;
            while (block) {
              const next = block.next as TypeBlock | null;
              replacement.appendChild(block);
              block = next;
            }
          }
          else {
            replacement.appendChild(this);
          }
          // remove empty cell. tableCellFormat.optimize need col to compute
          if (selfParent && selfParent.length() === 0) {
            selfParent.parent.remove();
          }
        }
        else {
          if (selfParent != null) {
            selfParent.insertBefore(replacement, this.next);
          }
          replacement.appendChild(this);
        }
        return replacement;
      }
      else {
        this.moveChildren(replacement);
      }
    }
    if (this.parent != null) {
      this.parent.insertBefore(replacement, this.next || undefined);
      this.remove();
    }
    this.attributes.copy(replacement as TypeParchment.BlockBlot);
    return replacement;
  }

  format(name: string, value: any): void {
    if (name === blotName.tableCellInner && this.parent.statics.blotName === name && !value) {
      // when set tableCellInner null. not only clear current block tableCellInner block and also
      // need move td/tr after current cell out of current table. like code-block, split into two table
      let tableWrapper: TableWrapperFormat | null = null;
      let tableRow: TableRowFormat | null = null;
      let tableCell: TableCellFormat | null = null;
      let target = this.parent;
      while (target && (!tableWrapper || !tableRow || !tableCell) && target !== this.scroll) {
        switch (target.statics.blotName) {
          case blotName.tableWrapper: {
            tableWrapper = target as TableWrapperFormat;
            break;
          }
          case blotName.tableRow: {
            tableRow = target as TableRowFormat;
            break;
          }
          case blotName.tableCell: {
            tableCell = target as TableCellFormat;
            break;
          }
        }
        target = target.parent;
      }
      if (!tableWrapper || !tableRow || !tableCell) {
        throw new Error(`${this.statics.blotName} must be a child of table`);
      }
      const tableNext = tableWrapper.next;
      tableRow = tableRow.next as TableRowFormat;
      tableCell = tableCell.next as TableCellFormat;

      // clear cur block
      tableWrapper.parent.insertBefore(this, tableNext);
      // only move out of table. `optimize` will generate new table
      // move table cell
      while (tableCell) {
        const next = tableCell.next;
        tableWrapper.parent.insertBefore(tableCell, tableNext);
        tableCell = next as TableCellFormat;
      }
      // move table row
      while (tableRow) {
        const next = tableRow.next;
        tableWrapper.parent.insertBefore(tableRow, tableNext);
        tableRow = next as TableRowFormat;
      }
    }
    else {
      super.format(name, value);
    }
  }
}
