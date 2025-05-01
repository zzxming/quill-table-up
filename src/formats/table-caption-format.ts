import type { Parchment as TypeParchment } from 'quill';
import type TypeInline from 'quill/blots/inline';
import type TypeScroll from 'quill/blots/scroll';
import type TypeText from 'quill/blots/text';
import type { TableCaptionValue } from '../utils';
import Quill from 'quill';
import ArrowUpDown from '../svg/arrow-up-down.svg';
import { blotName } from '../utils';
import { BlockOverride } from './overrides';

const Parchment = Quill.import('parchment');
const Inline = Quill.import('blots/inline') as typeof TypeInline;
const Text = Quill.import('blots/text') as typeof TypeText;

export class TableCaptionFormat extends BlockOverride {
  static blotName = blotName.tableCaption;
  static tagName = 'caption';
  static className = 'ql-table-caption';
  static allowedChildren = [Inline, Text];

  static create(value: TableCaptionValue) {
    const { tableId } = value;
    const node = super.create() as HTMLElement;
    node.dataset.tableId = tableId;
    if (value.side === 'bottom') {
      node.style.captionSide = 'bottom';
    }
    return node;
  }

  static formats(domNode: HTMLElement) {
    const { tableId } = domNode.dataset;
    const value: TableCaptionValue = {
      tableId: String(tableId),
      side: domNode.style.captionSide === 'bottom' ? 'bottom' : 'top',
    };
    return value;
  }

  declare scroll: TypeScroll;
  declare uiNode: HTMLElement;
  constructor(scroll: TypeScroll, domNode: HTMLElement, _value: TableCaptionValue) {
    super(scroll, domNode);
    domNode.setAttribute('contenteditable', String(scroll.isEnabled()));

    this.attachUI(this.createUI());
    this.domNode.addEventListener('mouseenter', () => {
      if (!this.scroll.isEnabled()) return;
      this.uiNode.style.display = 'flex';
    });
    this.domNode.addEventListener('mouseleave', () => {
      if (!this.scroll.isEnabled()) return;
      this.uiNode.style.display = 'none';
    });
  }

  createUI(): HTMLElement {
    const node = document.createElement('i');
    node.classList.add('ql-table-caption--switch');
    node.innerHTML = ArrowUpDown;
    node.addEventListener('click', () => {
      if (!this.scroll.isEnabled()) return;
      this.side = this.side === 'top' ? 'bottom' : 'top';
    });
    return node;
  }

  get tableId() {
    return this.domNode.dataset.tableId!;
  }

  set side(value: TableCaptionValue['side']) {
    this.domNode.style.captionSide = value === 'bottom' ? 'bottom' : 'top';
  }

  get side() {
    return this.domNode.style.captionSide === 'bottom' ? 'bottom' : 'top';
  }

  format(name: string, value: any): void {
    const isBlock = this.scroll.query(name, Parchment.Scope.BLOCK_BLOT);
    if (!isBlock || name === this.statics.blotName) {
      super.format(name, value);
    }
  }

  checkMerge(): boolean {
    const next = this.next as TableCaptionFormat;

    return (
      next !== null
      && next.statics.blotName === this.statics.blotName
      && next.tableId === this.tableId
    );
  }

  optimize(context: Record<string, any>) {
    const parent = this.parent;
    if (parent !== null && parent.statics.blotName !== blotName.tableMain) {
      const { tableId } = this;
      this.wrap(blotName.tableMain, { tableId });
    }

    if (this.children.length === 0) {
      this.remove();
    }
    else {
      super.optimize(context);
      if (this.next != null && this.checkMerge()) {
        (this.next as TypeParchment.ParentBlot).moveChildren(this);
        this.next.remove();
      }
    }
  }
}
