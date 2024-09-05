import Quill from 'quill';
import type { Parchment as TypeParchment } from 'quill';
import type TypeBlock from 'quill/blots/block';
import { blotName } from '../utils';

const Parchment = Quill.import('parchment');
const Container = Quill.import('blots/container') as typeof TypeParchment.ContainerBlot;
const Block = Quill.import('blots/block') as TypeParchment.BlotConstructor;
const BlockEmbed = Quill.import('blots/block/embed') as TypeParchment.BlotConstructor;

export class ContainerFormat extends Container {
  static blotName: string = blotName.container;
  static tagName = 'container';
  static scope = Parchment.Scope.BLOCK_BLOT;

  static allowedChildren?: TypeParchment.BlotConstructor[] = [Block, BlockEmbed, Container];
  static requiredContainer: TypeParchment.BlotConstructor;
  static defaultChild?: TypeParchment.BlotConstructor;

  clearDeltaCache() {
    // eslint-disable-next-line unicorn/no-array-for-each
    this.children.forEach((child) => {
      (child as TypeBlock).cache = {};
    });
  }

  insertBefore(blot: TypeParchment.Blot, ref?: TypeParchment.Blot | null) {
    // when block line remove will merge format. but in TableCellInner will get TableCellInner format
    // that will insert a new TableCellInner line but not a Block line
    // detail to see Quill module -> Keyboard -> handleBackspace
    if (blot.statics.blotName === this.statics.blotName && (blot as TypeParchment.ParentBlot).children.length > 0) {
      super.insertBefore((blot as TypeParchment.ParentBlot).children.head!, ref);
    }
    else {
      super.insertBefore(blot, ref);
    }
  }
}
