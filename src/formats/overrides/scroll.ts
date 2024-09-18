import Quill from 'quill';
import type { Parchment as TypeParchment } from 'quill';
import { blotName } from '../../utils';

const Parchment = Quill.import('parchment');
const ScrollBlot = Quill.import('blots/scroll') as any;

export class ScrollOverride extends ScrollBlot {
  createBlock(attributes: Record<string, any>, refBlot?: TypeParchment.Blot) {
    let createBlotName: string | undefined;
    let formats: Record<string, any> = {};
    // if attributes have not only one block blot. will save last. that will conflict with list/header in tableCellInner
    for (const [key, value] of Object.entries(attributes)) {
      const isBlockBlot = this.query(key, Parchment.Scope.BLOCK & Parchment.Scope.BLOT) != null;
      if (isBlockBlot) {
        createBlotName = key;
      }
      else {
        formats[key] = value;
      }
    }
    // only add this judgement to merge block blot at table cell
    if (createBlotName === blotName.tableCellInner) {
      formats = { ...attributes };
      delete formats[createBlotName];
    }

    const block = this.create(
      createBlotName || this.statics.defaultChild.blotName,
      createBlotName ? attributes[createBlotName] : undefined,
    ) as TypeParchment.ParentBlot;

    this.insertBefore(block, refBlot || undefined);

    const length = block.length();
    for (const [key, value] of Object.entries(formats)) {
      block.formatAt(0, length, key, value);
    }

    return block;
  }
}
