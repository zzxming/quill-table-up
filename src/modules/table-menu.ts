import type Quill from 'quill';
import type { TableCellInnerFormat, TableUp } from '..';
import type { TableMenuOptions, Tool, ToolOption } from '../utils';
import Color from '../svg/color.svg';
import InsertBottom from '../svg/insert-bottom.svg';
import InsertLeft from '../svg/insert-left.svg';
import InsertRight from '../svg/insert-right.svg';
import InsertTop from '../svg/insert-top.svg';
import MergeCell from '../svg/merge-cell.svg';
import RemoveColumn from '../svg/remove-column.svg';
import RemoveRow from '../svg/remove-row.svg';
import RemoveTable from '../svg/remove-table.svg';
import SplitCell from '../svg/split-cell.svg';
import { createToolTip, debounce, isArray, isFunction, randomId } from '../utils';

const usedColors = new Set<string>();

const parseNum = (num: any) => {
  const n = Number.parseFloat(num);
  return Number.isNaN(n) ? 0 : n;
};

const defaultTools: Tool[] = [
  {
    name: 'InsertTop',
    icon: InsertTop,
    tip: 'Insert row above',
    handle: (tableModule) => {
      tableModule.appendRow(false);
      tableModule.hideTableTools();
    },
  },
  {
    name: 'InsertRight',
    icon: InsertRight,
    tip: 'Insert column right',
    handle: (tableModule) => {
      tableModule.appendCol(true);
      tableModule.hideTableTools();
    },
  },
  {
    name: 'InsertBottom',
    icon: InsertBottom,
    tip: 'Insert row below',
    handle: (tableModule) => {
      tableModule.appendRow(true);
      tableModule.hideTableTools();
    },
  },
  {
    name: 'InsertLeft',
    icon: InsertLeft,
    tip: 'Insert column Left',
    handle: (tableModule) => {
      tableModule.appendCol(false);
      tableModule.hideTableTools();
    },
  },
  {
    name: 'break',
  },
  {

    name: 'MergeCell',
    icon: MergeCell,
    tip: 'Merge Cell',
    handle: (tableModule) => {
      tableModule.mergeCells();
      tableModule.hideTableTools();
    },
  },
  {

    name: 'SplitCell',
    icon: SplitCell,
    tip: 'Split Cell',
    handle: (tableModule) => {
      tableModule.splitCell();
      tableModule.hideTableTools();
    },
  },
  {
    name: 'break',
  },
  {
    name: 'DeleteRow',
    icon: RemoveRow,
    tip: 'Delete Row',
    handle: (tableModule) => {
      tableModule.removeRow();
      tableModule.hideTableTools();
    },
  },
  {
    name: 'DeleteColumn',
    icon: RemoveColumn,
    tip: 'Delete Column',
    handle: (tableModule) => {
      tableModule.removeCol();
      tableModule.hideTableTools();
    },
  },
  {
    name: 'DeleteTable',
    icon: RemoveTable,
    tip: 'Delete table',
    handle: (tableModule) => {
      tableModule.deleteTable();
    },
  },
  {
    name: 'break',
  },
  {
    name: 'BackgroundColor',
    icon: Color,
    isColorChoose: true,
    tip: 'Set background color',
    handle: (tableModule, selectedTds, color) => {
      tableModule.setBackgroundColor(selectedTds, color as string);
    },
  },
];

export class TableMenu {
  options: TableMenuOptions;
  menu: HTMLElement | null = null;
  selectedTds: TableCellInnerFormat[] = [];
  updateUsedColor: (this: any, color?: string) => void;
  colorItemClass = `color-${randomId()}`;
  tooltipItem: HTMLElement[] = [];

  constructor(public tableModule: TableUp, public quill: Quill, options: Partial<TableMenuOptions>) {
    this.options = this.resolveOptions(options);

    try {
      const storageValue = localStorage.getItem(this.options.localstorageKey) || '[]';
      let colorValue = JSON.parse(storageValue);
      if (!isArray(colorValue)) {
        colorValue = [];
      }
      colorValue.map((c: string) => usedColors.add(c));
    }
    catch {}

    this.updateUsedColor = debounce((color?: string) => {
      if (color) {
        usedColors.add(color);
      }
      if (usedColors.size > 10) {
        const saveColors = Array.from(usedColors).slice(-10);
        usedColors.clear();
        saveColors.map(v => usedColors.add(v));
      }

      localStorage.setItem(this.options.localstorageKey, JSON.stringify(Array.from(usedColors)));
      const usedColorWrappers = Array.from(document.querySelectorAll(`.${this.colorItemClass}.table-color-used`));
      for (const usedColorWrapper of usedColorWrappers) {
        if (!usedColorWrapper) continue;

        usedColorWrapper.innerHTML = '';
        for (const recordColor of usedColors) {
          const colorItem = document.createElement('div');
          colorItem.classList.add('table-color-used-item');
          colorItem.style.backgroundColor = recordColor;
          usedColorWrapper.appendChild(colorItem);
        }
      }
    }, 1000);

    if (!this.options.contextmenu) {
      this.menu = this.buildTools();
    }
    else {
      this.quill.root.addEventListener('contextmenu', this.listenContextmenu);
    }
  }

  resolveOptions(options: Partial<TableMenuOptions>) {
    return Object.assign({
      tipText: true,
      tipTexts: {},
      tools: defaultTools,
      localstorageKey: '__table-bg-used-color',
      contextmenu: false,
    }, options);
  };

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

  buildTools() {
    const toolBox = this.quill.addContainer('ql-table-menu');
    if (this.options.contextmenu) {
      toolBox.classList.add('contextmenu');
    }
    Object.assign(toolBox.style, { display: 'flex' });
    for (const tool of this.options.tools) {
      const { name, icon, handle, isColorChoose, tip = '' } = tool as ToolOption;
      const item = document.createElement(isColorChoose ? 'label' : 'span');
      item.classList.add('ql-table-menu-item');
      if (name === 'break') {
        item.classList.add('break');
      }
      else {
        // add icon
        const iconDom = document.createElement('i');
        iconDom.classList.add('icon');
        if (isFunction(icon)) {
          iconDom.appendChild(icon(this.tableModule));
        }
        else {
          iconDom.innerHTML = icon;
        }
        item.appendChild(iconDom);

        // color choose handler will trigger when the color input event
        if (isColorChoose) {
          const input = document.createElement('input');
          input.type = 'color';
          Object.assign(input.style, {
            width: 0,
            height: 0,
            padding: 0,
            border: 0,
            outline: 'none',
            opacity: 0,
          });

          const usedColorWrap = document.createElement('div');
          usedColorWrap.classList.add('table-color-used');
          usedColorWrap.classList.add(this.colorItemClass);
          item.appendChild(usedColorWrap);
          for (const recordColor of usedColors) {
            const colorItem = document.createElement('div');
            colorItem.classList.add('table-color-used-item');
            colorItem.style.backgroundColor = recordColor;
            usedColorWrap.appendChild(colorItem);
          }
          usedColorWrap.addEventListener('click', (e) => {
            e.preventDefault();
            const item = e.target as HTMLElement;
            if (item && item.style.backgroundColor && this.selectedTds.length > 0) {
              this.tableModule.setBackgroundColor(this.selectedTds, item.style.backgroundColor);
            }
          });
          const tooltipItem = createToolTip(item, { content: usedColorWrap, direction: 'top' });
          tooltipItem && this.tooltipItem.push(tooltipItem);

          if (isFunction(handle)) {
            input.addEventListener('input', () => {
              handle(this.tableModule, this.selectedTds, input.value);
              this.updateUsedColor(input.value);
            }, false);
          }
          item.appendChild(input);
          if (this.options.contextmenu) {
            item.addEventListener('click', e => e.stopPropagation());
          }
        }
        else {
          isFunction(handle) && item.addEventListener('click', (e) => {
            this.quill.focus();
            handle(this.tableModule, this.selectedTds, e);
          }, false);
        }

        // add text
        const tipText = this.options.tipTexts[name] || tip;
        if (tipText && tip) {
          if (this.options.contextmenu) {
            const tipTextDom = document.createElement('span');
            tipTextDom.textContent = tipText;
            item.appendChild(tipTextDom);
          }
          else {
            const tipTextDom = createToolTip(item, { msg: tipText });
            tipTextDom && this.tooltipItem.push(tipTextDom);
          }
        }
      }
      toolBox.appendChild(item);
    }
    return toolBox;
  };

  hideTools() {
    this.menu && Object.assign(this.menu.style, { display: 'none' });
  }

  updateTools(position?: { x: number; y: number }) {
    if (!this.menu || !this.tableModule.tableSelection || !this.tableModule.tableSelection.boundary) return;
    const { boundary, selectedTds } = this.tableModule.tableSelection;
    this.selectedTds = selectedTds;

    if (!this.options.contextmenu) {
      Object.assign(this.menu.style, {
        display: 'flex',
        left: `${boundary.x + (boundary.width / 2) - 1}px`,
        top: `${boundary.y + boundary.height}px`,
        transform: `translate(-50%, 20%)`,
      });
      // limit menu in viewport
      const { paddingLeft, paddingRight } = getComputedStyle(this.quill.root);
      const menuRect = this.menu.getBoundingClientRect();
      const rootRect = this.quill.root.getBoundingClientRect();
      if (menuRect.right > rootRect.right - parseNum(paddingRight)) {
        Object.assign(this.menu.style, {
          left: `${rootRect.right - rootRect.left - menuRect.width - parseNum(paddingRight) - 1}px`,
          transform: `translate(0%, 20%)`,
        });
      }
      else if (menuRect.left < parseNum(paddingLeft)) {
        Object.assign(this.menu.style, {
          left: `${parseNum(paddingLeft) + 1}px`,
          transform: `translate(0%, 20%)`,
        });
      }
    }
    else {
      if (!position) {
        return this.hideTools();
      }
      const { x, y } = position;
      const containerRect = this.quill.container.getBoundingClientRect();
      let resLeft = x - containerRect.left;
      let resTop = y - containerRect.top;
      Object.assign(this.menu.style, {
        display: 'flex',
        left: null,
        top: null,
      });
      const menuRect = this.menu.getBoundingClientRect();
      if (resLeft + menuRect.width + containerRect.left > containerRect.right) {
        resLeft = containerRect.width - menuRect.width - 15;
      }
      if (resTop + menuRect.height + containerRect.top > containerRect.bottom) {
        resTop = containerRect.height - menuRect.height - 15;
      }
      Object.assign(this.menu.style, {
        left: `${resLeft}px`,
        top: `${resTop}px`,
      });
    }
  }

  destroy() {
    for (const tooltip of this.tooltipItem) tooltip.remove();
    this.quill.root.removeEventListener('contextmenu', this.listenContextmenu);
    if (!this.menu) return;
    this.menu.remove();
    this.menu = null;
  }
}
