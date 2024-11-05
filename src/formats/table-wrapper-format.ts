import { blotName } from '../utils';
import { ContainerFormat } from './container-format';
import { TableBodyFormat } from './table-body-format';
import { TableColgroupFormat } from './table-colgroup-format';

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
    setTimeout(() => {
      const tableBodys = (this.descendants(TableBodyFormat));
      const tableColgroups = (this.descendants(TableColgroupFormat));
      if (tableBodys.length === 0 || tableColgroups.length === 0)
        this.remove();
    }, 0);
  }
}
