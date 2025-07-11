import type { Parchment as TypeParchment } from 'quill';
import type { BlockEmbed as TypeBlockEmbed } from 'quill/blots/block';
import Quill from 'quill';
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

// copy from `quill/blots/block`
function bubbleFormats(
  blot: TypeParchment.Blot | null,
  formats: Record<string, unknown> = {},
  filter = true,
): Record<string, unknown> {
  if (blot == null) return formats;
  if ('formats' in blot && typeof blot.formats === 'function') {
    formats = {
      ...formats,
      ...blot.formats(),
    };
    if (filter) {
      // exclude syntax highlighting from deltas and getFormat()
      delete formats['code-token'];
    }
  }
  if (
    blot.parent == null
    || blot.parent.statics.blotName === 'scroll'
    || blot.parent.statics.scope !== blot.statics.scope
  ) {
    return formats;
  }
  return bubbleFormats(blot.parent, formats, filter);
}
