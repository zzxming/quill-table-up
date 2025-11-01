export const randomId = () => Math.random().toString(36).slice(2);
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timestamp: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: Parameters<T>) {
    if (timestamp) {
      clearTimeout(timestamp);
    }
    timestamp = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}
