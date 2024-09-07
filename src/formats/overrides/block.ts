import Quill from 'quill';
import type TypeBlock from 'quill/blots/block';
import type { Parchment as TypeParchment } from 'quill';
import { blotName } from '../../utils';
import type { TableCellInnerFormat } from '../table-cell-inner-format';

const Parchment = Quill.import('parchment');
const Block = Quill.import('blots/block') as typeof TypeBlock;

export class BlockOverride extends Block {
  public replaceWith(name: string | TypeParchment.Blot, value?: any): TypeParchment.Blot {
    const replacement = typeof name === 'string' ? this.scroll.create(name, value) : name;
    if (replacement instanceof Parchment.ParentBlot) {
      // replace block to TableCellInner length is 0 when setContents
      // that will set text direct in TableCellInner but not in block
      // so we need to set text in block and block in TableCellInner
      // wrap with TableCellInner.formatAt when length is 0 will create a new block
      // that can make sure TableCellInner struct correctly
      if (replacement.statics.blotName === blotName.tableCellInner) {
        return this.wrap(blotName.tableCellInner, (replacement as TableCellInnerFormat).formats()[blotName.tableCellInner]);
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
}
