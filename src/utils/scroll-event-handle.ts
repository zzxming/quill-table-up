interface ScrollHandle {
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
