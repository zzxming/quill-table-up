export const handleIfTransitionend = (domNode: HTMLElement, duration: number, handler: () => void, options?: boolean | AddEventListenerOptions, lastTimer?: ReturnType<typeof setTimeout>): ReturnType<typeof setTimeout> => {
  if (lastTimer) clearTimeout(lastTimer);
  domNode.addEventListener('transitionend', handler, options);
  // handle remove when transition set none
  return setTimeout(() => {
    handler();
  }, duration);
};
