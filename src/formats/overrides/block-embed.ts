import Quill from 'quill';
import { bubbleFormats, type BlockEmbed as TypeBlockEmbed } from 'quill/blots/block';
import { blotName } from '../../utils';

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
    // because BlockEmbed is the last line of the tableCellInner. need add value in delta, also need add 1 to length
    const formats = bubbleFormats(this);
    if (formats[blotName.tableCellInner] && (!this.next || this.next.length() <= 1)) {
      return super.length() + 1;
    }
    return super.length();
  }
}
