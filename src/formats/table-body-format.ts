import { blotName, findParentBlot, randomId } from '../utils';
import { ContainerFormat } from './container-format';

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
}
