import type Quill from 'quill';
import type { TableUp } from '../../table-up';
import type { TableMenuOptions, ToolTipOptions } from '../../utils';
import { limitDomInViewPort } from '../../utils';
import { menuColorSelectClassName } from './constants';
import { TableMenuCommon } from './table-menu-common';

type TableMenuOptionsInput = Partial<Omit<TableMenuOptions, 'texts'>>;
export class TableMenuContextmenu extends TableMenuCommon {
  colorChooseTooltipOption: ToolTipOptions = {
    direction: 'right',
  };

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
      // manual call menu show
      Object.assign(this.menu.style, { display: 'flex' });
      this.isMenuDisplay = true;

      this.update({ x: e.clientX, y: e.clientY });
      document.addEventListener('click', () => {
        this.hide();
      }, { once: true });
    }
    else {
      this.hide();
    }
  };

  buildTools(): HTMLElement {
    const menu = super.buildTools();
    menu.classList.add(this.bem.is('contextmenu'));
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

  // override show. because TableSelection will call tableMenu.show() after select td
  show() {}

  update(position?: { x: number; y: number }) {
    if (!this.isMenuDisplay || !this.menu || !this.tableModule.tableSelection || !this.tableModule.tableSelection.boundary) return;
    if (!position) {
      return;
    }

    super.update();
    const style: Record<string, any> = {
      display: 'flex',
      left: 0,
      top: 0,
    };

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
    this.quill.root.removeEventListener('contextmenu', this.listenContextmenu);
    super.destroy();
  }
}
