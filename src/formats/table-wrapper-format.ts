import Quill from 'quill';
import { blotName } from '../utils';
import { ContainerFormat } from './container-format';
import { TableBodyFormat } from './table-body-format';
import { TableColgroupFormat } from './table-colgroup-format';

const Parchment = Quill.import('parchment');

export class TableWrapperFormat extends ContainerFormat {
  static blotName = blotName.tableWrapper;
  static tagName = 'div';
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
    // not allow drop content into table
    node.addEventListener('drop', (e) => {
      e.preventDefault();
    });
    node.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'none';
    });
    return node;
  }

  // quill scroll doesn't extends EventEmitter ts type. `on` and `off` will have dts error
  constructor(public scroll: any, node: Node, _value: string) {
    super(scroll, node);
    this.scroll.emitter.on(Quill.events.TEXT_CHANGE, this.insertLineAround);
  }

  get tableId() {
    return this.domNode.dataset.tableId!;
  }

  checkMerge(): boolean {
    const next = this.next as TableWrapperFormat;
    return (
      next !== null
      && next.statics.blotName === this.statics.blotName
      && next.tableId === this.tableId
    );
  }

  deleteAt(index: number, length: number) {
    super.deleteAt(index, length);
    const tableBodys = (this.descendants(TableBodyFormat));
    const tableColgroups = (this.descendants(TableColgroupFormat));
    if (tableBodys.length === 0 || tableColgroups.length === 0) {
      this.remove();
    }
  }

  remove() {
    super.remove();
    this.scroll.emitter.off(Quill.events.TEXT_CHANGE, this.insertLineAround);
  }

  insertLineAround = () => {
    if (!this.prev || !(this.prev instanceof Parchment.BlockBlot)) {
      this.parent.insertBefore(this.scroll.create('block'), this);
    }
    if (!this.next || !(this.next instanceof Parchment.BlockBlot)) {
      this.parent.appendChild(this.scroll.create('block'));
    }
  };
}
