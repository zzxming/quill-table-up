export interface ScrollHandle {
  scrollHandler: [HTMLElement, (e: Event) => void][];
}
export function addScrollEvent(this: ScrollHandle, dom: HTMLElement, handle: (e: Event) => void) {
  dom.addEventListener('scroll', handle);
  this.scrollHandler.push([dom, handle]);
}

export function removeScrollEvent(this: ScrollHandle, dom: HTMLElement, handle: (e: Event) => void) {
  for (let i = 0; i < this.scrollHandler.length; i++) {
    const [_dom, _handle] = this.scrollHandler[i];
    if (_dom === dom && _handle === handle) {
      this.scrollHandler.splice(i, 1);
      break;
    }
  }
}

export function clearScrollEvent(this: ScrollHandle) {
  for (const [dom, handle] of this.scrollHandler) {
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

export class AutoScroller {
  mouseY = 0;
  mouseX = 0;
  private animationId: number | null = null;

  constructor(
    public scrollThresholdX: number = 50,
    public scrollThresholdY: number = 20,
    public maxScrollSpeed: number = 20,
  ) {}

  checkMinY(containerRect: DOMRect) {
    return this.mouseY < containerRect.top + this.scrollThresholdY;
  }

  checkMaxY(containerRect: DOMRect) {
    return this.mouseY > containerRect.bottom - this.scrollThresholdY;
  }

  checkMinX(containerRect: DOMRect) {
    return this.mouseX < containerRect.left + this.scrollThresholdX;
  }

  checkMaxX(containerRect: DOMRect) {
    return this.mouseX > containerRect.right - this.scrollThresholdX;
  }

  start(container: HTMLElement, onScroll?: (speedX: number, speedY: number) => void) {
    // before call `start` also need call `updateMousePosition`
    // consider if needed put `getBoundingClientRect` in `scroll`
    const rect = container.getBoundingClientRect();
    const scroll = () => {
      let scrolled = false;
      let speedX = 0;
      let speedY = 0;
      if (this.checkMinY(rect)) {
        const distance = rect.top + this.scrollThresholdY - this.mouseY;
        const speed = Math.min(distance / this.scrollThresholdY * this.maxScrollSpeed, this.maxScrollSpeed);
        container.scrollTop -= speed;
        speedY = -1 * speed;
        scrolled = true;
      }
      else if (this.checkMaxY(rect)) {
        const distance = this.mouseY - (rect.bottom - this.scrollThresholdY);
        const speed = Math.min(distance / this.scrollThresholdY * this.maxScrollSpeed, this.maxScrollSpeed);
        container.scrollTop += speed;
        speedY = speed;
        scrolled = true;
      }

      if (this.checkMinX(rect)) {
        const distance = rect.left + this.scrollThresholdX - this.mouseX;
        const speed = Math.min(distance / this.scrollThresholdX * this.maxScrollSpeed, this.maxScrollSpeed);
        container.scrollLeft -= speed;
        speedX = -1 * speed;
        scrolled = true;
      }
      else if (this.checkMaxX(rect)) {
        const distance = this.mouseX - (rect.right - this.scrollThresholdX);
        const speed = Math.min(distance / this.scrollThresholdX * this.maxScrollSpeed, this.maxScrollSpeed);
        container.scrollLeft += speed;
        speedX = speed;
        scrolled = true;
      }

      if (scrolled && onScroll) {
        onScroll(speedX, speedY);
      }
      this.animationId = requestAnimationFrame(scroll);
    };

    this.animationId = requestAnimationFrame(scroll);
  }

  // update mouse position when `mousemove` event triggered
  updateMousePosition(x: number, y: number) {
    this.mouseX = x;
    this.mouseY = y;
  }

  // stop listening scroll event when `mouseup` event triggered
  stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}
