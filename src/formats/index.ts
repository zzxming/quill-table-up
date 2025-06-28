import type { TableMainFormat } from './table-main-format';
import { findChildBlot } from '../utils';
import { TableBodyFormat } from './table-body-format';

export * from './container-format';
export * from './overrides';
export * from './table-body-format';
export * from './table-caption-format';
export * from './table-cell-format';
export * from './table-cell-inner-format';
export * from './table-col-format';
export * from './table-colgroup-format';
export * from './table-main-format';
export * from './table-row-format';
export * from './table-wrapper-format';

export function getTableMainRect(tableMainBlot: TableMainFormat) {
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
