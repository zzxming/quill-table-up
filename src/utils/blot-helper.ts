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

export function findChildBlot<T extends TypeParchment.BlotConstructor>(parent: TypeParchment.Parent, blot: T) {
  const descendants: InstanceType<T>[] = [];
  const next = parent.children.iterator();
  let cur: TypeParchment.Blot | null = null;
  while ((cur = next())) {
    if (cur instanceof blot) {
      descendants.push(cur as InstanceType<T>);
    }
  }
  return descendants;
}

function mixinProps<T = any, U = any>(target: T, source: U, excludeReg?: RegExp) {
  for (const prop of Object.getOwnPropertyNames(source)) {
    if (excludeReg && excludeReg.test(prop)) continue;
    Object.defineProperty(target, prop, Object.getOwnPropertyDescriptor(source, prop)!);
  }
  return target;
}
export function mixinClass<
  T extends Constructor,
  U extends Constructor[],
>(
  base: T,
  mixins: U,
): T & Omit<U[number], 'constructor' | keyof InstanceType<T>> {
  const targetClass: any = class extends base {};
  for (const source of mixins) {
    mixinProps(targetClass.prototype, source.prototype, /^constructor$/);
  }

  return targetClass;
}
export function isSubclassOf(childClass: any, parentClass: any): boolean {
  return childClass.prototype && childClass.prototype instanceof parentClass;
}
