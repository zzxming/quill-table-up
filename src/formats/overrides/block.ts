import Quill from 'quill';
import type TypeBlock from 'quill/blots/block';
import type { Parchment as TypeParchment } from 'quill';
import { blotName } from '../../utils';
import { TableCellFormat } from '../table-cell-format';

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
      // if set tableCellInner null. set block in td. `enforceAllowedChildren` will move block child out of table
      const tableCellInner = this.parent;
      const tableCell = tableCellInner.parent;
      if (tableCell instanceof TableCellFormat) {
        tableCell.insertBefore(this, tableCellInner);
        tableCellInner.remove();
      }
    }
    else {
      super.format(name, value);
    }
  }
}
