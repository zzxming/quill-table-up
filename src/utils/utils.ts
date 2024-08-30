import type { Parchment as TypeParchment } from 'quill';

export const isFunction = (val: any): val is Function => typeof val === 'function';
export const isArray = Array.isArray;
export const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number) => {
  let timestamp: number;
  return function (this: any, ...args: Parameters<T>) {
    if (timestamp) {
      clearTimeout(timestamp);
    }
    timestamp = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};
export const findParentBlot = <T>(blot: TypeParchment.Blot, targetBlotName: string): T => {
  let target = blot.parent;
  while (target && target.statics.blotName !== targetBlotName && target !== blot.scroll) {
    target = target.parent;
  }
  if (target === blot.scroll) {
    throw new Error(`${blot.statics.blotName} must be a child of ${targetBlotName}`);
  }
  return target as T;
};
export const randomId = () => Math.random().toString(36).slice(2);
