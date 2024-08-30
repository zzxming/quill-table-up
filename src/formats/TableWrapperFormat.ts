import type { Parchment as TypeParchment } from 'quill';
import { blotName } from '../utils';
import { ContainerFormat } from './ContainerFormat';

export class TableWrapperFormat extends ContainerFormat {
  static blotName = blotName.tableWrapper;
  static tagName = 'p';
  static className = 'ql-table-wrapper';

  static create(value: string) {
    const node = super.create() as HTMLElement;

    node.dataset.tableId = value;
    node.addEventListener(
      'dragstart',
      (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      true,
    );
    // 不允许拖拽进 table
    node.addEventListener('drop', (e) => {
      e.preventDefault();
    });
    // 修改拖拽进入时的鼠标样式
    node.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'none';
    });
    return node;
  }

  get tableId() {
    return this.domNode.dataset.tableId!;
  }

  insertBefore(blot: TypeParchment.Blot, ref?: TypeParchment.Blot | null) {
    if (blot.statics.blotName === this.statics.blotName) {
      // 合并
      super.insertBefore((blot as TypeParchment.ParentBlot).children.head!, ref);
    }
    else if (this.statics.allowedChildren.some((child: TypeParchment.BlotConstructor) => child.blotName === blot.statics.blotName)) {
      // 允许子 blot
      super.insertBefore(blot, ref);
    }
    else {
      // 非允许子 blot, ref 为 null 是插入头, 否则插入尾
      if (ref) {
        this.prev ? this.prev.insertBefore(blot, null) : this.parent.insertBefore(blot, this);
      }
      else {
        this.next ? this.next.insertBefore(blot, ref) : this.parent.appendChild(blot);
      }
    }
  }

  checkMerge(): boolean {
    const next = this.next;
    return (
      next !== null
      && next.statics.blotName === this.statics.blotName
      && next.domNode.tagName === this.domNode.tagName
      && next.domNode.dataset.tableId === this.tableId
    );
  }

  deleteAt(index: number, length: number) {
    super.deleteAt(index, length);
    // 删除 table 时隐藏当前 table 的 tooltip
    document.querySelector(`.ql-table-tooltip[data-table-id="${this.tableId}"]`)?.classList?.add('ql-hidden');
  }
}
