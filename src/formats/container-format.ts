import type { Parchment as TypeParchment } from 'quill';
import Quill from 'quill';
import { blotName, isFunction } from '../utils';

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

  static allowAttrs = new Set<string>([]);
  static allowDataAttrs = new Set<string>([]);
  // handle the attribute change when use `setFormatValue`
  static allowDataAttrsChangeHandler: Record<string, string> = {};

  static create(_value?: unknown) {
    const node = document.createElement(this.tagName);
    if (this.className) {
      node.classList.add(this.className);
    }
    return node;
  }

  setFormatValue(name: string, value?: any) {
    if (this.statics.allowAttrs.has(name) || this.statics.allowDataAttrs.has(name)) {
      let attrName = name;
      if (this.statics.allowDataAttrs.has(name)) {
        attrName = `data-${name}`;
      }
      if (value) {
        this.domNode.setAttribute(attrName, value);
      }
      else {
        this.domNode.removeAttribute(attrName);
      }
      const methodName = this.statics.allowDataAttrsChangeHandler[name] as keyof this;
      if (methodName && isFunction(this[methodName])) {
        (this[methodName] as Function)(value);
      }
    }
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

  public enforceAllowedChildren(): void {
    // the origin `enforceAllowedChildren` only unwrap the first block
    // remove flag `done`. all block format in table container need be unwrap

    // eslint-disable-next-line unicorn/no-array-for-each
    this.children.forEach((child: TypeParchment.Blot) => {
      const allowed = this.statics.allowedChildren.some(
        (def: TypeParchment.BlotConstructor) => child instanceof def,
      );
      if (allowed) {
        return;
      }
      if (child.statics.scope === Parchment.Scope.BLOCK_BLOT) {
        // only child is in table format need keep split blot. else use the origin method
        if (child.parent instanceof ContainerFormat) {
          if (child.next != null) {
            child.parent.splitAfter(child);
          }
          if (child.prev != null) {
            child.parent.splitAfter(child.prev);
          }
        }
        else {
          if (child.next != null) {
            this.splitAfter(child);
          }
          if (child.prev != null) {
            this.splitAfter(child.prev);
          }
        }
        child.parent.unwrap();
      }
      else if (child instanceof Parchment.ParentBlot) {
        child.unwrap();
      }
      else {
        child.remove();
      }
    });
  }
}
