import type { Parchment as TypeParchment } from 'quill';
import type { TableMainFormat } from './table-main-format';
import { blotName, findChildBlot } from '../utils';
import { TableBodyFormat } from './table-body-format';

export * from './container-format';
export * from './overrides';
export * from './table-body-format';
export * from './table-caption-format';
export * from './table-cell-format';
export * from './table-cell-inner-format';
export * from './table-col-format';
export * from './table-colgroup-format';
export * from './table-foot-format';
export * from './table-head-format';
export * from './table-main-format';
export * from './table-row-format';
export * from './table-wrapper-format';

export function getTableMainRect(tableMainBlot: TableMainFormat) {
  const mainBlotName: Set<string> = new Set([blotName.tableHead, blotName.tableBody, blotName.tableFoot]);
  const childIterator = tableMainBlot.children.iterator();
  let child: null | TypeParchment.Blot = null;
  const mainBlot = [];
  while ((child = childIterator())) {
    if (mainBlotName.has(child.statics.blotName)) {
      mainBlot.push(child);
    }
  }
  const mainBlotRect = mainBlot.reduce((rect, blot) => {
    const blotRect = (blot.domNode as HTMLElement).getBoundingClientRect();
    return {
      ...rect,
      top: Math.min(rect.top, blotRect.top),
      bottom: Math.max(rect.bottom, blotRect.bottom),
      left: Math.min(rect.left, blotRect.left),
      right: Math.max(rect.right, blotRect.right),
    };
  }, {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  });
  mainBlotRect.width = mainBlotRect.right - mainBlotRect.left;
  mainBlotRect.height = mainBlotRect.bottom - mainBlotRect.top;
  mainBlotRect.x = mainBlotRect.left;
  mainBlotRect.y = mainBlotRect.top;

  const [tableBodyBlot] = findChildBlot(tableMainBlot, TableBodyFormat);
  if (!tableBodyBlot) {
    return {
      body: null,
      rect: null,
    };
  }
  return {
    body: tableBodyBlot,
    rect: tableBodyBlot.domNode.getBoundingClientRect(),
  };
}
