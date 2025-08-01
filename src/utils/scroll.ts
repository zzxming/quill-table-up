export interface ScrollHandle {
  scrollHandler: [HTMLElement, (e: Event) => void][];
}
export function addScrollEvent(this: ScrollHandle, dom: HTMLElement, handle: (e: Event) => void) {
  dom.addEventListener('scroll', handle);
  this.scrollHandler.push([dom, handle]);
}

export function clearScrollEvent(this: ScrollHandle) {
  for (let i = 0; i < this.scrollHandler.length; i++) {
    const [dom, handle] = this.scrollHandler[i];
    dom.removeEventListener('scroll', handle);
  }
  this.scrollHandler = [];
}

export function getElementScrollPosition(el: HTMLElement) {
  return {
    y: el.scrollTop,
    x: el.scrollLeft,
  };
}

export function getScrollBarWidth({ target = document.body } = {}): number {
  const outer = document.createElement('div');
  Object.assign(outer.style, {
    visibility: 'hidden',
    width: '100px',
    height: '100%',
    overflow: 'auto',
    position: 'absolute',
    top: '-9999px',
  });
  target.appendChild(outer);

  const widthNoScroll = outer.offsetWidth;
  outer.style.overflow = 'scroll';

  const inner = document.createElement('div');
  inner.style.width = '100%';
  outer.appendChild(inner);

  const widthWithScroll = inner.offsetWidth;
  outer.parentNode?.removeChild(outer);

  return widthNoScroll - widthWithScroll;
}
