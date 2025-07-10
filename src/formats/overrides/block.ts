import type { Parchment as TypeParchment } from 'quill';
import type TypeBlock from 'quill/blots/block';
import type TypeContainer from 'quill/blots/container';
import type { TableCellInnerFormat } from '../table-cell-inner-format';
import Quill from 'quill';
import { blotName, findParentBlot, isString } from '../../utils';

const Parchment = Quill.import('parchment');
const Block = Quill.import('blots/block') as typeof TypeBlock;
const Container = Quill.import('blots/container') as typeof TypeContainer;

export class BlockOverride extends Block {
  replaceWith(name: string | TypeParchment.Blot, value?: any): TypeParchment.Blot {
    const replacement = isString(name) ? this.scroll.create(name, value) : name;
    if (replacement instanceof Parchment.ParentBlot) {
      // replace block to TableCellInner length is 0 when setContents
      // that will set text direct in TableCellInner but not in block
      // so we need to set text in block and block in TableCellInner
      // wrap with TableCellInner.formatAt when length is 0 will create a new block
      // that can make sure TableCellInner struct correctly
      if (replacement.statics.blotName === blotName.tableCellInner) {
        // skip if current block already in TableCellInner
        try {
          const cellInner = findParentBlot(this, blotName.tableCellInner);
          const cellValue = cellInner.formats();
          const replacementValue = (replacement as TableCellInnerFormat).formats();
          const keys = Object.keys(cellValue);
          if (keys.every(key => JSON.stringify(cellValue[key]) === JSON.stringify(replacementValue[key]))) {
            return cellInner;
          }
        }
        catch {}

        const selfParent = this.parent;
        if (selfParent.statics.blotName === blotName.tableCellInner) {
          if (selfParent != null) {
            selfParent.insertBefore(replacement, this.prev ? null : this.next);
          }
          if (selfParent.statics.blotName === blotName.tableCellInner) {
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
          // `list` will wrap Container. tableCellInner should be insert outside it
          if (selfParent instanceof Container) {
            selfParent.parent.insertBefore(replacement, selfParent);
          }
          else if (selfParent != null) {
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
      this.parent.insertBefore(replacement, this.next);
      this.remove();
    }
    this.attributes.copy(replacement as TypeParchment.BlockBlot);
    return replacement;
  }

  format(name: string, value: any): void {
    if (name === blotName.tableCellInner && this.parent.statics.blotName === name && !value) {
      try {
        const cellInner = findParentBlot(this, blotName.tableCellInner);
        cellInner.unwrap();
      }
      catch {
        console.error('unwrap TableCellInner error');
      }
    }
    else {
      super.format(name, value);
    }
  }
}
