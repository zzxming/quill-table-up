import type { Parchment as TypeParchment } from 'quill';
import type { TableBodyFormat, TableCellFormat, TableCellInnerFormat, TableColFormat, TableColgroupFormat, TableMainFormat, TableRowFormat, TableWrapperFormat } from '../formats';
import type { blotName } from './constants';
import type { Constructor } from './types';

interface ParentBlotReturnMap {
  [blotName.tableWrapper]: TableWrapperFormat;
  [blotName.tableMain]: TableMainFormat;
  [blotName.tableCol]: TableColFormat;
  [blotName.tableColgroup]: TableColgroupFormat;
  [blotName.tableBody]: TableBodyFormat;
  [blotName.tableRow]: TableRowFormat;
  [blotName.tableCell]: TableCellFormat;
  [blotName.tableCellInner]: TableCellInnerFormat;
}
type ParentBlotReturn = {
  [key: string]: TypeParchment.Parent;
} & ParentBlotReturnMap;

export function findParentBlot<T extends TypeParchment.Parent, U extends string = string>(
  blot: TypeParchment.Blot,
  targetBlotName: U,
): U extends keyof ParentBlotReturn ? ParentBlotReturn[U] : T {
  let target = blot.parent;
  while (target && target.statics.blotName !== targetBlotName && target !== blot.scroll) {
    target = target.parent;
  }
  if (target === blot.scroll) {
    throw new Error(`${blot.statics.blotName} must be a child of ${targetBlotName}`);
  }
  return target as any;
}

export function findParentBlots<T extends (keyof ParentBlotReturnMap | string)[]>(
  blot: TypeParchment.Blot,
  targetBlotNames: T,
): { [K in keyof T]: ParentBlotReturn[T[K]] } {
  const resultBlots: TypeParchment.Parent[] = new Array(targetBlotNames.length);
  const blotNameIndexMaps = new Map<string, number>(targetBlotNames.map((name, i) => [name, i]));
  let target = blot.parent;
  while (target && target !== blot.scroll) {
    if (blotNameIndexMaps.size === 0) break;
    if (blotNameIndexMaps.has(target.statics.blotName)) {
      const index = blotNameIndexMaps.get(target.statics.blotName)!;
      resultBlots[index] = target;
      blotNameIndexMaps.delete(target.statics.blotName);
    }
    target = target.parent;
  }
  if (blotNameIndexMaps.size > 0) {
    throw new Error(`${blot.statics.blotName} must be a child of ${Array.from(blotNameIndexMaps.keys()).join(', ')}`);
  }
  return resultBlots as any;
}

export function findAllParentBlot(Blot: TypeParchment.Blot) {
  const blots: Map<string, TypeParchment.Blot> = new Map();
  let target = Blot;
  while (target && target.statics.blotName !== 'scroll') {
    blots.set(target.statics.blotName, target);
    target = target.parent;
  }
  return blots;
}

function mixinProps<T = any, U = any>(target: T, source: U) {
  for (const prop of Object.getOwnPropertyNames(source)) {
    if (/^constructor$/.test(prop)) continue;
    Object.defineProperty(target, prop, Object.getOwnPropertyDescriptor(source, prop)!);
  }
  return target as typeof target & Omit<typeof source, 'constructor'>;
}
export function mixinClass<
  T extends Constructor,
  U extends Constructor[],
>(
  base: T,
  mixins: U,
): T & Omit<U[number], 'constructor' | keyof InstanceType<T>> {
  const targetClass: any = class extends base {
    constructor(...props: any[]) {
      super(...props);
    }
  };
  for (const source of mixins) {
    mixinProps<typeof targetClass.prototype, typeof source.prototype>(targetClass.prototype, source.prototype);
  }

  return targetClass;
}
