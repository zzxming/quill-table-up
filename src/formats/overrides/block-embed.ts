import type { BlockEmbed as TypeBlockEmbed } from 'quill/blots/block';
import type { TableCellInnerFormat } from '../table-cell-inner-format';
import Quill from 'quill';
import { blotName, bubbleFormats, findParentBlot } from '../../utils';

const BlockEmbed = Quill.import('blots/block/embed') as typeof TypeBlockEmbed;

export class BlockEmbedOverride extends BlockEmbed {
  delta() {
    // if BlockEmbed is the last line of the tableCellInner. need to add value in delta
    const delta = super.delta();
    const formats = bubbleFormats(this);
    if (formats[blotName.tableCellInner]) {
      delta.insert('\n', { [blotName.tableCellInner]: formats[blotName.tableCellInner] });
    }
    return delta;
  }

  length() {
    const formats = bubbleFormats(this);
    if (formats[blotName.tableCellInner]) {
      return super.length() + 1;
    }
    return super.length();
  }

  formatAt(index: number, length: number, name: string, value: unknown) {
    if (name === blotName.tableCellInner) {
      try {
        const currentCellInner = findParentBlot(this, blotName.tableCellInner);
        const newCellInner = this.scroll.create(blotName.tableCellInner, value) as TableCellInnerFormat;
        currentCellInner.insertBefore(newCellInner, this);
        newCellInner.appendChild(this);
        if (currentCellInner.length() === 0) {
          currentCellInner.remove();
        }
      }
      catch {}
    }
    else {
      this.format(name, value);
    }
  }
}
