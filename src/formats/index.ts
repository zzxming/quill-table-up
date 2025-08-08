import type { Parchment as TypeParchment } from 'quill';
import type { TableBodyFormat } from './table-body-format';
import type { TableFootFormat } from './table-foot-format';
import type { TableHeadFormat } from './table-head-format';
import type { TableMainFormat } from './table-main-format';
import { blotName } from '../utils';

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

export function getTableMainRect(tableMainBlot: TableMainFormat): {
  rect: DOMRect | null;
  head: TableHeadFormat | null;
  body: TableBodyFormat | null;
  foot: TableFootFormat | null;
} {
  const mainBlotName: Set<string> = new Set([blotName.tableHead, blotName.tableBody, blotName.tableFoot]);
  const childIterator = tableMainBlot.children.iterator();
  let child: null | TypeParchment.Blot = null;
  const mainBlot: Record<string, TypeParchment.Blot> = {};
  while ((child = childIterator())) {
    if (mainBlotName.has(child.statics.blotName)) {
      mainBlot[child.statics.blotName] = child;
    }
  }
  if (Object.values(mainBlot).length <= 0) {
    return {
      rect: null,
      head: null,
      body: null,
      foot: null,
    };
  }
  const mainBlotRect = Object.values(mainBlot).reduce((rect, blot) => {
    const blotRect = (blot.domNode as HTMLElement).getBoundingClientRect();
    return {
      ...rect,
      top: Math.min(rect.top, blotRect.top),
      bottom: Math.max(rect.bottom, blotRect.bottom),
      left: Math.min(rect.left, blotRect.left),
      right: Math.max(rect.right, blotRect.right),
    };
  }, {
    top: Infinity,
    bottom: 0,
    left: Infinity,
    right: 0,
    width: 0,
    height: 0,
    x: Infinity,
    y: Infinity,
  } as DOMRect);
  mainBlotRect.width = mainBlotRect.right - mainBlotRect.left;
  mainBlotRect.height = mainBlotRect.bottom - mainBlotRect.top;
  mainBlotRect.x = mainBlotRect.left;
  mainBlotRect.y = mainBlotRect.top;

  return {
    rect: mainBlotRect,
    head: mainBlot[blotName.tableHead] as TableHeadFormat || null,
    body: mainBlot[blotName.tableBody] as TableBodyFormat || null,
    foot: mainBlot[blotName.tableFoot] as TableFootFormat || null,
  };
}
