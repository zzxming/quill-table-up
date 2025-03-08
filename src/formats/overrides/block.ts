import type { Parchment as TypeParchment } from 'quill';
import type TypeBlock from 'quill/blots/block';
import Quill from 'quill';
import { blotName, findParentBlots } from '../../utils';

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
            selfParent.remove();
            if (selfParent.parent.statics.blotName === blotName.tableCell && selfParent.parent.length() === 0) {
              selfParent.parent.remove();
            }
            const selfRow = selfParent.parent.parent;
            if (selfRow.statics.blotName === blotName.tableRow && selfRow.children.length === 0) {
              selfRow.remove();
            }
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
      const [tableCell, tableRow, tableWrapper] = findParentBlots(this, [blotName.tableCell, blotName.tableRow, blotName.tableWrapper] as const);
      const tableNext = tableWrapper.next;
      let tableRowNext = tableRow.next;
      let tableCellNext = tableCell.next;

      // clear cur block
      tableWrapper.parent.insertBefore(this, tableNext);
      // only move out of table. `optimize` will generate new table
      // move table cell
      while (tableCellNext) {
        const next = tableCellNext.next;
        tableWrapper.parent.insertBefore(tableCellNext, tableNext);
        tableCellNext = next as TypeParchment.ContainerBlot;
      }
      // move table row
      while (tableRowNext) {
        const next = tableRowNext.next;
        tableWrapper.parent.insertBefore(tableRowNext, tableNext);
        tableRowNext = next as TypeParchment.ContainerBlot;
      }
    }
    else {
      super.format(name, value);
    }
  }
}
