import type { Parchment as TypeParchment } from 'quill';
import Quill from 'quill';
import { blotName } from '../utils';

const Parchment = Quill.import('parchment');
const Container = Quill.import('blots/container') as typeof TypeParchment.ContainerBlot;
const Block = Quill.import('blots/block') as TypeParchment.BlotConstructor;
const BlockEmbed = Quill.import('blots/block/embed') as TypeParchment.BlotConstructor;

export class ContainerFormat extends Container {
  static tagName: string;
  static blotName: string = blotName.container;
  static scope = Parchment.Scope.BLOCK_BLOT;

  static allowedChildren?: TypeParchment.BlotConstructor[] = [Block, BlockEmbed, Container];
  static requiredContainer: TypeParchment.BlotConstructor;
  static defaultChild?: TypeParchment.BlotConstructor;

  static create(_value?: unknown) {
    const node = document.createElement(this.tagName);
    if (this.className) {
      node.classList.add(this.className);
    }
    return node;
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
