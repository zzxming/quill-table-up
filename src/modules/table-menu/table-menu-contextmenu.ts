import type Quill from 'quill';
import type TableUp from '../..';
import type { TableMenuOptions } from '../../utils';
import { limitDomInViewPort } from '../../utils';
import { contextmenuClassName, menuColorSelectClassName } from './constants';
import { TableMenuCommon } from './table-menu-common';

type TableMenuOptionsInput = Partial<Omit<TableMenuOptions, 'texts'>>;
export class TableMenuContextmenu extends TableMenuCommon {
  constructor(public tableModule: TableUp, public quill: Quill, options: TableMenuOptionsInput) {
    super(tableModule, quill, options);

    this.quill.root.addEventListener('contextmenu', this.listenContextmenu);
  }

  listenContextmenu = (e: MouseEvent) => {
    e.preventDefault();

    const path = e.composedPath() as HTMLElement[];
    if (!path || path.length <= 0) return;

    const tableNode = path.find(node => node.tagName && node.tagName.toUpperCase() === 'TABLE' && node.classList.contains('ql-table'));

    if (tableNode && this.tableModule.tableSelection?.selectedTds?.length) {
      if (!this.menu) {
        this.menu = this.buildTools();
      }
      this.updateTools({ x: e.clientX, y: e.clientY });
      document.addEventListener('click', () => {
        this.hideTools();
      }, { once: true });
    }
    else {
      this.hideTools();
    }
  };

  buildTools(): HTMLElement {
    const menu = super.buildTools();
    menu.classList.add(contextmenuClassName);
    const items = menu.getElementsByClassName(menuColorSelectClassName);
    for (const item of Array.from(items)) {
      item.addEventListener('click', e => e.stopPropagation());
    }
    document.body.appendChild(menu);
    return menu;
  }

  createTipText(item: HTMLElement, text: string): void {
    const tipTextDom = document.createElement('span');
    tipTextDom.textContent = text;
    item.appendChild(tipTextDom);
  }

  updateTools(position?: { x: number; y: number }) {
    if (!this.menu || !this.tableModule.tableSelection || !this.tableModule.tableSelection.boundary) return;
    super.updateTools();
    const style: Record<string, any> = {
      display: 'flex',
      left: 0,
      top: 0,
    };

    if (!position) {
      return this.hideTools();
    }
    const { x, y } = position;
    style.left = x;
    style.top = y;

    Object.assign(this.menu.style, {
      ...style,
      left: `${style.left + window.scrollX}px`,
      top: `${style.top + window.scrollY}px`,
    });

    // limit menu in viewport
    const menuRect = this.menu.getBoundingClientRect();
    const { left: limitLeft, top: limitTop } = limitDomInViewPort(menuRect);
    Object.assign(this.menu.style, {
      left: `${limitLeft + window.scrollX}px`,
      top: `${limitTop + window.scrollY}px`,
    });
  }

  destroy() {
    for (const tooltip of this.tooltipItem) tooltip.destroy();
    this.quill.root.removeEventListener('contextmenu', this.listenContextmenu);
    if (!this.menu) return;
    this.menu.remove();
    this.menu = null;
  }
}
