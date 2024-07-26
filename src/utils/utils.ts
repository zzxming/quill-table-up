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
