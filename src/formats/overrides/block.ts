import type { Parchment as TypeParchment } from 'quill';
import type TypeBlock from 'quill/blots/block';
import type TypeContainer from 'quill/blots/container';
import type { TableCellInnerFormat } from '../table-cell-inner-format';
import Quill from 'quill';
import { blotName, findParentBlot, isString } from '../../utils';
import { isSameCellValue } from '../utils';

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
        // skip if current block already in same TableCellInner
        let currentTableCellInner: TableCellInnerFormat | null = null;
        try {
          currentTableCellInner = findParentBlot(this, blotName.tableCellInner);
          const cellValue = currentTableCellInner.formats();
          const replacementValue = (replacement as TableCellInnerFormat).formats();
          if (isSameCellValue(cellValue, replacementValue)) {
            return currentTableCellInner;
          }
        }
        catch {}

        if (currentTableCellInner) {
          // use TableCellInner insertBefore to find the correct position
          currentTableCellInner.insertBefore(replacement, this);
          replacement.appendChild(this);
        }
        else {
          // find the first parent not container
          let currentParent = this as TypeParchment.Parent;
          let lastParent = currentParent;
          while (currentParent.parent !== this.scroll && currentParent.parent instanceof Container) {
            lastParent = currentParent;
            currentParent = currentParent.parent;
          }
          // if parent all container until scroll. use the last container
          if (currentParent === this.scroll) {
            currentParent = lastParent;
          }
          // split current block as a separate "line" and wrap tableCellInner
          const index = this.offset(currentParent);
          const length = this.length();
          const selfParent = currentParent.isolate(index, length);
          if (selfParent && selfParent.parent) {
            selfParent.parent.insertBefore(replacement, selfParent.next);
          }
          replacement.appendChild(this);
        }
        return replacement;
      }
      else {
        this.moveChildren(replacement);
      }
    }
    if (this.parent !== null) {
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
