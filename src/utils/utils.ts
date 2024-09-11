import type { Parchment as TypeParchment } from 'quill';
import type { TableBodyFormat, TableCellFormat, TableCellInnerFormat, TableColFormat, TableColgroupFormat, TableMainFormat, TableRowFormat } from '../formats';
import type { blotName } from './constants';

export const isFunction = (val: any): val is Function => typeof val === 'function';
export const isArray = Array.isArray;

export const randomId = () => Math.random().toString(36).slice(2);
export const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number) => {
  let timestamp: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: Parameters<T>) {
    if (timestamp) {
      clearTimeout(timestamp);
    }
    timestamp = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

interface ParentBlotReturnMap {
  [blotName.tableMain]: TableMainFormat;
  [blotName.tableCol]: TableColFormat;
  [blotName.tableColgroup]: TableColgroupFormat;
  [blotName.tableBody]: TableBodyFormat;
  [blotName.tableRow]: TableRowFormat;
  [blotName.tableCell]: TableCellFormat;
  [blotName.tableCellInner]: TableCellInnerFormat;
};
export function findParentBlot<T extends TypeParchment.Parent, U extends string = string>(
  blot: TypeParchment.Blot,
  targetBlotName: U,
): U extends keyof ParentBlotReturnMap ? ParentBlotReturnMap[U] : T {
  let target = blot.parent;
  while (target && target.statics.blotName !== targetBlotName && target !== blot.scroll) {
    target = target.parent;
  }
  if (target === blot.scroll) {
    throw new Error(`${blot.statics.blotName} must be a child of ${targetBlotName}`);
  }
  return target as any;
}
