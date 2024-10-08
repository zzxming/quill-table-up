import type { Parchment as TypeParchment } from 'quill';
import type TypeBlock from 'quill/blots/block';
import Quill from 'quill';
import { blotName } from '../utils';

const Parchment = Quill.import('parchment');
const Container = Quill.import('blots/container') as typeof TypeParchment.ContainerBlot;
const Block = Quill.import('blots/block') as TypeParchment.BlotConstructor;
const BlockEmbed = Quill.import('blots/block/embed') as TypeParchment.BlotConstructor;

export class ContainerFormat extends Container {
  static blotName: string = blotName.container;
  static scope = Parchment.Scope.BLOCK_BLOT;

  static allowedChildren?: TypeParchment.BlotConstructor[] = [Block, BlockEmbed, Container];
  static requiredContainer: TypeParchment.BlotConstructor;
  static defaultChild?: TypeParchment.BlotConstructor;

  clearDeltaCache() {
    const blocks = this.descendants(Block, 0);
    for (const child of blocks) {
      (child as TypeBlock).cache = {};
    }
  }

  insertBefore(blot: TypeParchment.Blot, ref?: TypeParchment.Blot | null) {
    // when block line remove will merge format. but in TableCellInner will get TableCellInner format
    // that will insert a new TableCellInner line. not a Block line
    // detail to see Quill module -> Keyboard -> handleBackspace
    if (blot.statics.blotName === this.statics.blotName && (blot as TypeParchment.ParentBlot).children.length > 0) {
      super.insertBefore((blot as TypeParchment.ParentBlot).children.head!, ref);
    }
    else {
      super.insertBefore(blot, ref);
    }
  }

  insertAt(index: number, value: string, def?: any): void {
    const [child] = this.children.find(index);
    if (!child) {
      const defaultChild = this.scroll.create(this.statics.defaultChild.blotName || 'block');
      this.appendChild(defaultChild);
    }
    super.insertAt(index, value, def);
  }

  public optimize(_context: Record<string, any>) {
    if (this.children.length === 0) {
      if (this.statics.defaultChild != null) {
        const child = this.scroll.create(this.statics.defaultChild.blotName);
        this.appendChild(child);
      }
      else {
        this.remove();
      }
    }

    if (this.children.length > 0 && this.next != null && this.checkMerge()) {
      this.next.moveChildren(this);
      this.next.remove();
    }
  }
}
