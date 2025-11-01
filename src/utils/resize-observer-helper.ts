export interface CreateResizeObserverOptions {
  ignoreFirstBind: boolean;
}
export function createResizeObserver(callback: (entries: ResizeObserverEntry[]) => void, options: Partial<CreateResizeObserverOptions> = {}) {
  const ignoreFirstBindSymbol = Symbol('ignoreFirstBind');
  type ResizeObserveTarget = Element & { [ignoreFirstBindSymbol]?: boolean };
  const observeEls: Set<ResizeObserveTarget> = new Set();
  const observer = new ResizeObserver((entries) => {
    // prevent when element first bind
    if (
      options.ignoreFirstBind
      && entries.some((entry) => {
        const target = entry.target as ResizeObserveTarget;
        const originVal = target[ignoreFirstBindSymbol];
        target[ignoreFirstBindSymbol] = true;
        return !originVal;
      })
    ) {
      return;
    }
    callback(entries);
  });
  const originObserve = observer.observe.bind(observer);
  observer.observe = (target: ResizeObserveTarget, options?: ResizeObserverOptions) => {
    observeEls.add(target);
    originObserve(target, options);
  };

  const originUnobserve = observer.unobserve;
  observer.unobserve = (target: ResizeObserveTarget) => {
    if (observeEls.has(target)) {
      observeEls.delete(target);
      target[ignoreFirstBindSymbol] = undefined;
    }
    originUnobserve.call(observer, target);
  };

  const originDisconnect = observer.disconnect;
  observer.disconnect = () => {
    for (const target of observeEls.values()) {
      target[ignoreFirstBindSymbol] = undefined;
    }
    originDisconnect.call(observer);
  };

  return observer;
}
