import type Quill from 'quill';
// import InsertTop from '../svg/insert-top.svg';
// import InsertBottom from '../svg/insert-bottom.svg';
// import InsertLeft from '../svg/insert-left.svg';
// import InsertRight from '../svg/insert-right.svg';
// import RemoveColumn from '../svg/remove-column.svg';
// import RemoveRow from '../svg/remove-row.svg';
import RemoveTable from '../svg/remove-table.svg';
import Color from '../svg/color.svg';
import { createToolTip, debounce, isArray, isFunction } from '../utils';
import type { TableMenuOptions, Tool, ToolOption } from '../utils';
import type { TableCellInnerFormat, TableUp } from '..';

const usedColors = new Set<string>();

const parseNum = (num: any) => {
  const n = Number.parseFloat(num);
  return Number.isNaN(n) ? 0 : n;
};

const defaultTools: Tool[] = [
  // {
  //   name: 'InsertTop',
  //   icon: InsertTop,
  //   tip: '向上插入一行',
  //   handle: (tableModule) => {
  //     tableModule.insertRow(0);
  //   },
  // },
  // {
  //   name: 'InsertRight',
  //   icon: InsertRight,
  //   tip: '向右插入一列',
  //   handle: (tableModule) => {
  //     tableModule.insertColumn(1);
  //   },
  // },
  // {
  //   name: 'InsertBottom',
  //   icon: InsertBottom,
  //   tip: '向下插入一行',
  //   handle: (tableModule) => {
  //     tableModule.insertRow(1);
  //   },
  // },
  // {
  //   name: 'InsertLeft',
  //   icon: InsertLeft,
  //   tip: '向左插入一列',
  //   handle: (tableModule) => {
  //     tableModule.insertColumn(0);
  //   },
  // },
  // {
  //   name: 'break',
  // },
  // {
  //   name: 'DeleteRow',
  //   icon: RemoveRow,
  //   tip: '删除当前行',
  //   handle: (tableModule) => {
  //     tableModule.deleteRow();
  //   },
  // },
  // {
  //   name: 'DeleteColumn',
  //   icon: RemoveColumn,
  //   tip: '删除当前列',
  //   handle: (tableModule) => {
  //     tableModule.deleteColumn();
  //   },
  // },
  {
    name: 'DeleteTable',
    icon: RemoveTable,
    tip: '删除当前表格',
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
    tip: '设置背景颜色',
    handle: (tableModule, selectedTds, color) => {
      tableModule.setBackgroundColor(selectedTds, color as string);
    },
  },
];

export class TableMenu {
  options: TableMenuOptions;
  menu: HTMLElement | null;
  selectedTds: TableCellInnerFormat[] = [];
  updateUsedColor: (this: any, menuItem: HTMLElement, color?: string) => void;

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

    this.updateUsedColor = debounce((menuItem: HTMLElement, color?: string) => {
      if (color) {
        usedColors.add(color);
      }
      if (usedColors.size > 10) {
        const saveColors = Array.from(usedColors).slice(-10);
        usedColors.clear();
        saveColors.map(v => usedColors.add(v));
      }

      localStorage.setItem(this.options.localstorageKey, JSON.stringify(Array.from(usedColors)));
      const usedColorWrapper = menuItem.querySelector('.table-color-used');
      if (!usedColorWrapper) return;

      usedColorWrapper.innerHTML = '';
      for (const recordColor of usedColors) {
        const colorItem = document.createElement('div');
        colorItem.classList.add('table-color-used-item');
        colorItem.style.backgroundColor = recordColor;
        colorItem.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.selectedTds.length > 0) {
            this.tableModule.setBackgroundColor(this.selectedTds, colorItem.style.backgroundColor);
          }
        });
        usedColorWrapper.appendChild(colorItem);
      }
    }, 1000);

    this.menu = this.buildTools();
  }

  resolveOptions(options: Partial<TableMenuOptions>) {
    return Object.assign({
      tipText: true,
      tipTexts: {},
      tools: defaultTools,
      localstorageKey: '__table-bg-used-color',
    }, options);
  };

  buildTools() {
    const toolBox = this.quill.addContainer('ql-table-selection-tool');
    for (const tool of this.options.tools) {
      const { name, icon, handle, isColorChoose, tip = '' } = tool as ToolOption;
      let item = document.createElement(isColorChoose ? 'label' : 'span');
      item.classList.add('ql-table-selection-item');
      if (name === 'break') {
        item.classList.add('break');
      }
      else {
        item.classList.add('icon');
        if (isFunction(icon)) {
          item.appendChild(icon(this.tableModule));
        }
        else {
          item.innerHTML = icon;
        }

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
          item.appendChild(usedColorWrap);
          this.updateUsedColor(item);
          item.addEventListener('mouseenter', () => {
            if (usedColors.size === 0) return;
            Object.assign(usedColorWrap.style, {
              display: 'flex',
            });
          });
          item.addEventListener('mouseleave', () => {
            Object.assign(usedColorWrap.style, {
              display: 'none',
            });
          });

          if (isFunction(handle)) {
            item.addEventListener('click', e => e.stopPropagation());
            input.addEventListener('input', () => {
              handle(this.tableModule, this.selectedTds, input.value);
              this.updateUsedColor(item, input.value);
            }, false);
          }
          item.appendChild(input);
        }
        else {
          isFunction(handle) && item.addEventListener('click', (e) => {
            this.quill.focus();
            handle(this.tableModule, this.selectedTds, e);
          }, false);
        }

        const tipText = this.options.tipTexts[name] || tip;
        if (tipText && tip) {
          item = createToolTip(item, { msg: tipText, delay: 150 });
        }
      }
      toolBox.appendChild(item);
    }
    return toolBox;
  };

  hideTools() {
    this.menu && Object.assign(this.menu.style, { display: 'none' });
  }

  updateTools() {
    if (!this.menu || !this.tableModule.tableSelection || !this.tableModule.tableSelection.boundary) return;
    const { boundary, selectedTds } = this.tableModule.tableSelection;
    this.selectedTds = selectedTds;

    Object.assign(this.menu.style, {
      display: 'flex',
      left: `${boundary.x + (boundary.width / 2) - 1}px`,
      top: `${boundary.y + boundary.height}px`,
      transform: `translate(-50%, 20%)`,
    });
    // limit menu in viewport
    const { paddingLeft, paddingRight } = getComputedStyle(this.quill.root);
    const menuRect = this.menu.getBoundingClientRect();
    const containerRect = this.quill.container.getBoundingClientRect();
    if (menuRect.right > containerRect.right - parseNum(paddingRight)) {
      Object.assign(this.menu.style, {
        left: `${containerRect.right - containerRect.left - menuRect.width - parseNum(paddingRight) - 1}px`,
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

  destroy() {
    if (!this.menu) return;
    this.menu.remove();
    this.menu = null;
  }
}