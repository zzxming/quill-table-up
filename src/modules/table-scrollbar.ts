import type { TableMainFormat } from '../formats';
import type { TableUp } from '../table-up';
import Quill from 'quill';
import { TableBodyFormat } from '../formats';
import { addScrollEvent, clearScrollEvent, createBEM, debounce, findChildBlot } from '../utils';

export class Scrollbar {
  minSize: number = 20;
  gap: number = 4;
  move: number = 0;
  cursorDown: boolean = false;
  cursorLeave: boolean = false;
  ratioY: number = 1;
  ratioX: number = 1;
  sizeWidth: string = '';
  sizeHeight: string = '';
  size: string = '';
  thumbState: {
    X: number;
    Y: number;
  } = {
      X: 0,
      Y: 0,
    };

  ob: ResizeObserver;
  container: HTMLElement;
  scrollbar: HTMLElement;
  thumb: HTMLElement = document.createElement('div');
  scrollHandler: [HTMLElement, (e: Event) => void][] = [];
  propertyMap: { readonly size: 'height'; readonly offset: 'offsetHeight'; readonly scrollDirection: 'scrollTop'; readonly scrollSize: 'scrollHeight'; readonly axis: 'Y'; readonly direction: 'top'; readonly client: 'clientY' } | { readonly size: 'width'; readonly offset: 'offsetWidth'; readonly scrollDirection: 'scrollLeft'; readonly scrollSize: 'scrollWidth'; readonly axis: 'X'; readonly direction: 'left'; readonly client: 'clientX' };
  bem = createBEM('scrollbar');
  tableMainBlot: TableMainFormat;
  constructor(public quill: Quill, public isVertical: boolean, public table: HTMLElement, public scrollbarContainer: HTMLElement) {
    this.tableMainBlot = Quill.find(this.table) as TableMainFormat;
    this.container = table.parentElement!;
    this.propertyMap = this.isVertical
      ? {
          size: 'height',
          offset: 'offsetHeight',
          scrollDirection: 'scrollTop',
          scrollSize: 'scrollHeight',
          axis: 'Y',
          direction: 'top',
          client: 'clientY',
        } as const
      : {
          size: 'width',
          offset: 'offsetWidth',
          scrollDirection: 'scrollLeft',
          scrollSize: 'scrollWidth',
          axis: 'X',
          direction: 'left',
          client: 'clientX',
        } as const;
    this.calculateSize();
    this.ob = new ResizeObserver(() => {
      this.update();
    });
    this.ob.observe(table);
    this.scrollbar = this.createScrollbar();
    this.setScrollbarPosition();
    addScrollEvent.call(this, this.quill.root, () => this.setScrollbarPosition());
    this.showScrollbar();
  }

  update() {
    this.calculateSize();
    this.setScrollbarPosition();
  }

  setScrollbarPosition() {
    const [tableBodyBlot] = findChildBlot(this.tableMainBlot, TableBodyFormat);
    if (!tableBodyBlot) return;
    const { scrollLeft: editorScrollX, scrollTop: editorScrollY, offsetLeft: rootOffsetLeft, offsetTop: rootOffsetTop } = this.quill.root;
    const { offsetLeft: containerOffsetLeft, offsetTop: containerOffsetTop } = this.container;
    const { offsetLeft: bodyOffsetLeft, offsetTop: bodyOffsetTop } = tableBodyBlot.domNode;
    const { width: containerWidth, height: containerHeight } = this.container.getBoundingClientRect();
    const { width: tableWidth, height: tableHeight } = tableBodyBlot.domNode.getBoundingClientRect();

    let x = containerOffsetLeft + bodyOffsetLeft - rootOffsetLeft;
    let y = containerOffsetTop + bodyOffsetTop - rootOffsetTop;
    if (this.isVertical) {
      x += Math.min(containerWidth, tableWidth);
    }
    else {
      y += Math.min(containerHeight, tableHeight);
    }

    // table align right effect
    if (this.tableMainBlot && this.tableMainBlot.align !== 'left') {
      x += this.table.offsetLeft - containerOffsetLeft;
    }

    Object.assign(this.scrollbar.style, {
      [this.propertyMap.size]: `${this.isVertical ? Math.min(containerHeight, tableHeight) : containerWidth}px`,
      transform: `translate(${x - editorScrollX}px, ${y - editorScrollY}px)`,
    });
    this.containerScrollHandler(this.container);
  }

  calculateSize() {
    const offsetHeight = this.container.offsetHeight - this.gap;
    const offsetWidth = this.container.offsetWidth - this.gap;
    const originalHeight = offsetHeight ** 2 / this.container.scrollHeight;
    const originalWidth = offsetWidth ** 2 / this.container.scrollWidth;
    const height = Math.max(originalHeight, this.minSize);
    const width = Math.max(originalWidth, this.minSize);
    this.ratioY = originalHeight / (offsetHeight - originalHeight) / (height / (offsetHeight - height));
    this.ratioX = originalWidth / (offsetWidth - originalWidth) / (width / (offsetWidth - width));

    this.sizeWidth = width + this.gap < offsetWidth ? `${width}px` : '';
    this.sizeHeight = height + this.gap < offsetHeight ? `${height}px` : '';
    this.size = this.isVertical ? this.sizeHeight : this.sizeWidth;
  }

  createScrollbar() {
    const scrollbar = document.createElement('div');
    scrollbar.classList.add(this.bem.b());
    scrollbar.classList.add(this.isVertical ? this.bem.is('vertical') : this.bem.is('horizontal'), this.bem.is('transparent'));
    Object.assign(scrollbar.style, {
      display: 'none',
    });
    this.thumb.classList.add(this.bem.be('thumb'));
    let originDocSelect: typeof document.onselectstart = null;
    const mouseMoveDocumentHandler = (e: MouseEvent) => {
      if (this.cursorDown === false) return;
      const prevPage = this.thumbState[this.propertyMap.axis];
      if (!prevPage) return;

      const offsetRatio = this.scrollbar[this.propertyMap.offset] ** 2
        / this.container[this.propertyMap.scrollSize] / (this.isVertical ? this.ratioY : this.ratioX)
        / this.thumb[this.propertyMap.offset];
      const offset = (this.scrollbar.getBoundingClientRect()[this.propertyMap.direction] - e[this.propertyMap.client]) * -1;
      const thumbClickPosition = this.thumb[this.propertyMap.offset] - prevPage;
      const thumbPositionPercentage = ((offset - thumbClickPosition) * 100 * offsetRatio) / this.scrollbar[this.propertyMap.offset];
      this.container[this.propertyMap.scrollDirection] = (thumbPositionPercentage * this.container[this.propertyMap.scrollSize]) / 100;
    };
    const mouseUpDocumentHandler = () => {
      this.thumbState[this.propertyMap.axis] = 0;
      this.cursorDown = false;
      document.removeEventListener('mousemove', mouseMoveDocumentHandler);
      document.removeEventListener('mouseup', mouseUpDocumentHandler);
      if (this.cursorLeave) {
        this.hideScrollbar();
      }
      // eslint-disable-next-line unicorn/prefer-add-event-listener
      document.onselectstart = originDocSelect;
    };
    const startDrag = (e: MouseEvent) => {
      e.stopImmediatePropagation();
      this.cursorDown = true;
      document.addEventListener('mousemove', mouseMoveDocumentHandler);
      document.addEventListener('mouseup', mouseUpDocumentHandler);
      originDocSelect = document.onselectstart;
      // eslint-disable-next-line unicorn/prefer-add-event-listener
      document.onselectstart = () => false;
    };
    this.thumb.addEventListener('mousedown', (e: MouseEvent) => {
      e.stopPropagation();
      if (e.ctrlKey || [1, 2].includes(e.button)) return;

      window.getSelection()?.removeAllRanges();
      startDrag(e);

      const el = e.currentTarget as HTMLElement;
      if (!el) return;
      this.thumbState[this.propertyMap.axis] = el[this.propertyMap.offset] - (e[this.propertyMap.client] - el.getBoundingClientRect()[this.propertyMap.direction]);
    });
    const displayListener = [this.table, scrollbar];
    for (const el of displayListener) {
      el.addEventListener('mouseenter', this.showScrollbar);
      el.addEventListener('mouseleave', this.hideScrollbar);
    }

    addScrollEvent.call(this, this.container, () => {
      this.containerScrollHandler(this.container);
    });

    scrollbar.appendChild(this.thumb);
    return scrollbar;
  }

  containerScrollHandler(wrap: HTMLElement) {
    const offset = wrap[this.propertyMap.offset] - this.gap;
    this.move = wrap[this.propertyMap.scrollDirection] * 100 / offset * (this.isVertical ? this.ratioY : this.ratioX);
    Object.assign(this.thumb.style, {
      [this.propertyMap.size]: this.size,
      transform: `translate${this.propertyMap.axis}(${this.move}%)`,
    });
  }

  showScrollbar = debounce(() => {
    this.cursorLeave = false;
    this.scrollbar.removeEventListener('transitionend', this.hideScrollbarTransitionend);
    this.scrollbar.style.display = this.size ? 'block' : 'none';
    requestAnimationFrame(() => {
      this.scrollbar.classList.remove(this.bem.is('transparent'));
    });
  }, 200);

  hideScrollbar = debounce(() => {
    this.cursorLeave = true;
    if (this.cursorDown) return;
    this.scrollbar.removeEventListener('transitionend', this.hideScrollbarTransitionend);
    this.scrollbar.addEventListener('transitionend', this.hideScrollbarTransitionend, { once: true });
    this.scrollbar.classList.add(this.bem.is('transparent'));
  }, 200);

  hideScrollbarTransitionend = () => {
    this.scrollbar.style.display = (this.cursorDown && this.size) ? 'block' : 'none';
  };

  destroy() {
    this.ob.disconnect();
    clearScrollEvent.call(this);
    this.table.removeEventListener('mouseenter', this.showScrollbar);
    this.table.removeEventListener('mouseleave', this.hideScrollbar);
  }
}
export class TableVirtualScrollbar {
  scrollbarContainer: HTMLElement;
  scrollbar: Scrollbar[];
  bem = createBEM('scrollbar');
  constructor(public tableModule: TableUp, public table: HTMLElement, public quill: Quill) {
    this.scrollbarContainer = this.tableModule.addContainer(this.bem.be('container'));

    this.scrollbar = [
      new Scrollbar(quill, true, table, this.scrollbarContainer),
      new Scrollbar(quill, false, table, this.scrollbarContainer),
    ];
    for (const item of this.scrollbar) {
      this.scrollbarContainer.appendChild(item.scrollbar);
    }
    this.quill.on(Quill.events.TEXT_CHANGE, this.updateWhenTextChange);
  }

  updateWhenTextChange = () => {
    this.update();
  };

  hide() {
    for (const scrollbar of this.scrollbar) {
      scrollbar.hideScrollbar();
    }
  }

  show() {
    for (const scrollbar of this.scrollbar) {
      scrollbar.showScrollbar();
    }
  }

  update() {
    for (const scrollbar of this.scrollbar) {
      scrollbar.calculateSize();
      scrollbar.setScrollbarPosition();
    }
  }

  destroy() {
    this.scrollbarContainer.remove();
    this.quill.off(Quill.events.TEXT_CHANGE, this.updateWhenTextChange);
    for (const scrollbar of this.scrollbar) {
      scrollbar.destroy();
    }
  }
}
