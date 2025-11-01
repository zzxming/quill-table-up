import type { TableBodyTag } from '../utils';
import type { TableRowFormat } from './table-row-format';
import { blotName } from '../utils';
import { ContainerFormat } from './container-format';
import { TableCellInnerFormat } from './table-cell-inner-format';

export class TableBodyFormat extends ContainerFormat {
  static blotName: string = blotName.tableBody;
  static tagName = 'tbody';

  static create(value: string) {
    const node = super.create() as HTMLElement;
    node.dataset.tableId = value;
    return node;
  }

  get tableId() {
    return this.domNode.dataset.tableId!;
  }

  checkMerge(): boolean {
    const next = this.next as TableBodyFormat;
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

    super.optimize(context);
  }

  convertBody(tag: TableBodyTag) {
    const blots = this.descendants(TableCellInnerFormat);
    for (const blot of blots) {
      (blot as any).wrapTag = tag;
    }
  }

  getRows() {
    return Array.from(this.domNode.querySelectorAll('tr'))
      .map(el => this.scroll.find(el) as TableRowFormat)
      .filter(Boolean);
  }
}
