import type { Parchment as TypeParchment, Range as TypeRange } from 'quill';
import type { BlockEmbed as TypeBlockEmbed } from 'quill/blots/block';
import type TypeBlock from 'quill/blots/block';
import Quill from 'quill';
import { isNumber } from './is';

const Parchment = Quill.import('parchment');
const Block = Quill.import('blots/block') as typeof TypeBlock;
const BlockEmbed = Quill.import('blots/block/embed') as typeof TypeBlockEmbed;

// copy from `quill/core/editor`
export function combineFormats(
  formats: Record<string, unknown>,
  combined: Record<string, unknown>,
): Record<string, unknown> {
  return Object.keys(combined).reduce(
    (merged, name) => {
      if (formats[name] == null) return merged;
      const combinedValue = combined[name];
      if (combinedValue === formats[name]) {
        merged[name] = combinedValue;
      }
      else if (Array.isArray(combinedValue)) {
        // eslint-disable-next-line unicorn/prefer-ternary, unicorn/prefer-includes
        if (combinedValue.indexOf(formats[name]) < 0) {
          merged[name] = combinedValue.concat([formats[name]]);
        }
        else {
          // If style already exists, don't add to an array, but don't lose other styles
          merged[name] = combinedValue;
        }
      }
      else {
        merged[name] = [combinedValue, formats[name]];
      }
      return merged;
    },
    {} as Record<string, unknown>,
  );
}

// copy from `quill/blots/block`
export function bubbleFormats(
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

// copy from `quill/core/editor` and overrided. fix about https://github.com/slab/quill/pull/4719
export function getFormat(this: Quill, index?: number, length?: number): { [format: string]: unknown };
export function getFormat(this: Quill, range?: TypeRange): {
  [format: string]: unknown;
};
export function getFormat(this: Quill, index: TypeRange | number = this.getSelection(true), length = 0): { [format: string]: unknown } {
  if (!isNumber(index)) {
    length = index.length;
    index = index.index;
  }
  let lines: (TypeBlock | TypeBlockEmbed)[] = [];
  let leaves: TypeParchment.LeafBlot[] = [];
  if (length === 0) {
    for (const path of this.scroll.path(index)) {
      const [blot] = path;
      if (blot instanceof Block) {
        lines.push(blot);
      }
      else if (blot instanceof Parchment.LeafBlot && !(blot instanceof BlockEmbed)) {
        leaves.push(blot);
      }
    }
  }
  else {
    lines = this.scroll.lines(index, length).filter(line => !(line instanceof BlockEmbed));
    leaves = this.scroll.descendants(
      (blot: TypeParchment.Blot) => blot instanceof Parchment.LeafBlot && !(blot instanceof BlockEmbed),
      index,
      length,
    ) as TypeParchment.LeafBlot[];
  }
  const [lineFormats, leafFormats] = [lines, leaves].map((blots) => {
    const blot = blots.shift();
    if (blot == null) return {};
    let formats = bubbleFormats(blot);
    while (Object.keys(formats).length > 0) {
      const blot = blots.shift();
      if (blot == null) return formats;
      formats = combineFormats(bubbleFormats(blot), formats);
    }
    return formats;
  });
  return { ...lineFormats, ...leafFormats };
}
