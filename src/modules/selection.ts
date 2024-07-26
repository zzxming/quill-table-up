import type { Parchment } from 'quill';
import Quill from 'quill';
import type { AnyClass, TableSelectionOptions, Tool, ToolOption } from '../utils';
import { createToolTip, debounce, isArray, isFunction } from '../utils';

import InsertLeft from '../svg/insert-left.svg';
import InsertRight from '../svg/insert-right.svg';
import InsertTop from '../svg/insert-top.svg';
import InsertBottom from '../svg/insert-bottom.svg';
import RemoveRow from '../svg/remove-row.svg';
import RemoveColumn from '../svg/remove-column.svg';
import RemoveTable from '../svg/remove-table.svg';
import Color from '../svg/color.svg';
import type TableUp from '..';

const TableFormat = Quill.import('formats/table') as AnyClass;
const usedColors = new Set<string>();
const updateUsedColor = debounce((tableModule: TableUp, color: string) => {
  usedColors.add(color);
  if (usedColors.size > 10) {
    const saveColors = Array.from(usedColors).slice(-10);
    usedColors.clear();
    saveColors.map(v => usedColors.add(v));
  }

  localStorage.setItem(tableModule.selection.options.localstorageKey, JSON.stringify(Array.from(usedColors)));
  const usedColorWrapper = tableModule.selection.selectTool.querySelector('.table-color-wrapper .table-color-used');
  if (!usedColorWrapper) return;

  usedColorWrapper.innerHTML = '';
  for (const recordColor of usedColors) {
    const colorItem = document.createElement('div');
    colorItem.classList.add('table-color-used-item');
    colorItem.style.backgroundColor = recordColor;
    colorItem.addEventListener('click', (e) => {
      e.stopPropagation();
      tableModule.setBackgroundColor(colorItem.style.backgroundColor);
    });
    usedColorWrapper.appendChild(colorItem);
  }
}, 1000);

const getRelativeRect = (targetRect: DOMRect, containerRect: DOMRect) => ({
  x: targetRect.x - containerRect.x,
  y: targetRect.y - containerRect.y,
  width: targetRect.width,
  height: targetRect.height,
});

const parseNum = (num: any) => {
  const n = Number.parseFloat(num);
  return Number.isNaN(n) ? 0 : n;
};

const defaultTools: Tool[] = [
  {
    name: 'InsertTop',
    icon: InsertTop,
    tip: '向上插入一行',
    handle: (tableModule) => {
      tableModule.insertRow(0);
    },
  },
  {
    name: 'InsertRight',
    icon: InsertRight,
    tip: '向右插入一列',
    handle: (tableModule) => {
      tableModule.insertColumn(1);
    },
  },
  {
    name: 'InsertBottom',
    icon: InsertBottom,
    tip: '向下插入一行',
    handle: (tableModule) => {
      tableModule.insertRow(1);
    },
  },
  {
    name: 'InsertLeft',
    icon: InsertLeft,
    tip: '向左插入一列',
    handle: (tableModule) => {
      tableModule.insertColumn(0);
    },
  },
  {
    name: 'break',
  },
  {
    name: 'DeleteRow',
    icon: RemoveRow,
    tip: '删除当前行',
    handle: (tableModule) => {
      tableModule.deleteRow();
    },
  },
  {
    name: 'DeleteColumn',
    icon: RemoveColumn,
    tip: '删除当前列',
    handle: (tableModule) => {
      tableModule.deleteColumn();
    },
  },
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
    icon: (tableModule) => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('table-color-wrapper');
      const label = document.createElement('label');
      label.classList.add('table-color-picker');
      label.innerHTML = Color;
      const usedColorWrapper = document.createElement('div');
      usedColorWrapper.classList.add('table-color-used');

      for (const recordColor of usedColors) {
        const colorItem = document.createElement('div');
        colorItem.classList.add('table-color-used-item');
        colorItem.style.backgroundColor = recordColor;
        colorItem.addEventListener('click', (e) => {
          e.stopPropagation();
          tableModule.setBackgroundColor(colorItem.style.backgroundColor);
        });
        usedColorWrapper.appendChild(colorItem);
      }

      wrapper.appendChild(label);
      wrapper.appendChild(usedColorWrapper);

      wrapper.addEventListener('mouseenter', () => {
        if (usedColors.size === 0) return;
        usedColorWrapper.style.display = 'flex';
        const containerRect = tableModule.quill.container.getBoundingClientRect();
        const { paddingLeft, paddingRight } = getComputedStyle(tableModule.quill.root);
        const usedColorRect = usedColorWrapper.getBoundingClientRect();

        if (usedColorRect.right > containerRect.right - parseNum(paddingRight)) {
          Object.assign(usedColorWrapper.style, {
            transform: `translate(-80%, -100%)`,
          });
        }
        else if (usedColorRect.left < parseNum(paddingLeft)) {
          Object.assign(usedColorWrapper.style, {
            transform: `translate(-20%, -100%)`,
          });
        }
      });
      wrapper.addEventListener('mouseleave', () => {
        Object.assign(usedColorWrapper.style, {
          display: 'none',
          transform: null,
        });
      });

      return wrapper;
    },
    tip: '设置背景颜色',
    handle: (tableModule) => {
      const label = tableModule.selection.selectTool.querySelector('.table-color-picker');
      if (!label) return;

      let input = label.querySelector('input');
      if (!input) {
        input = document.createElement('input');
        input.type = 'color';
        Object.assign(input.style, {
          width: 0,
          height: 0,
          padding: 0,
          border: 0,
          outline: 'none',
          opacity: 0,
        });
        input.addEventListener('input', () => {
          tableModule.setBackgroundColor(input.value);
          updateUsedColor(tableModule, input.value);
        });
        label.appendChild(input);
      }
    },
  },
];

export class TableSelection {
  tableModule: TableUp;
  quill: Quill;
  options: TableSelectionOptions;
  tableBlot: Parchment.Parent | null = null;
  selectTd: Parchment.Parent | null = null;
  cellSelect: HTMLDivElement;
  boundary: { x: number; y: number; width: number; height: number } | null = null;
  selectTool: HTMLDivElement;

  constructor(tableModule: TableUp, quill: Quill, options: Partial<TableSelectionOptions> = {}) {
    this.tableModule = tableModule;
    this.quill = quill;
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

    this.cellSelect = this.quill.addContainer('ql-table-selection');
    this.selectTool = this.buildTools();

    this.quill.root.addEventListener('scroll', this.destory);
    // const resizeObserver = new ResizeObserver(this.destory);
    // resizeObserver.observe(this.quill.root);
    this.quill.on(Quill.events.EDITOR_CHANGE, () => {
      this.updateSelectBox();
    });
  }

  resolveOptions = (options: Partial<TableSelectionOptions>) => {
    return Object.assign({
      selectColor: '#0589f3',
      tipText: true,
      tools: defaultTools,
      localstorageKey: '__table-bg-used-color',
    }, options);
  };

  buildTools = () => {
    const toolBox = this.quill.addContainer('ql-table-selection-tool');
    for (const tool of this.options.tools) {
      const { name, icon, handle, tip = '' } = tool as ToolOption;
      let item = document.createElement('span');
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
        if (isFunction(handle)) {
          item.addEventListener('click', (e) => {
            this.quill.focus();
            handle(this.tableModule, e);
          });
        }
        if (this.options.tipText && tip) {
          item = createToolTip(item, { msg: tip, delay: 150 });
        }
      }
      toolBox.appendChild(item);
    }
    return toolBox;
  };

  remove = () => {
    Object.assign(this.cellSelect.style, {
      display: 'none',
    });
    Object.assign(this.selectTool.style, {
      display: 'none',
    });
    this.selectTd = null;
  };

  destory = () => {
    this.remove();
    this.tableBlot = null;
  };

  updateSelectBox = () => {
    const range = this.quill.getSelection();
    if (!range) return this.destory();
    // dts cannot find type Scroll
    const [blot] = (this.quill.scroll as any).descendant(TableFormat, range.index);
    if (!blot) return this.destory();
    this.selectTd = blot;
    const containerRect = this.quill.container.getBoundingClientRect();
    this.boundary = getRelativeRect(this.selectTd!.domNode.getBoundingClientRect(), containerRect);

    Object.assign(this.cellSelect.style, {
      'border-color': this.options.selectColor,
      'display': 'block',
      'left': `${this.boundary.x - 1}px`,
      'top': `${this.boundary.y - 1}px`,
      'width': `${this.boundary.width + 1}px`,
      'height': `${this.boundary.height + 1}px`,
    });
    Object.assign(this.selectTool.style, {
      display: 'flex',
      left: `${this.boundary.x + (this.boundary.width / 2) - 1}px`,
      top: `${this.boundary.y + this.boundary.height}px`,
      transform: `translate(-50%, 20%)`,
    });

    const { paddingLeft, paddingRight } = getComputedStyle(this.quill.root);
    const selectToolRect = this.selectTool.getBoundingClientRect();

    // why 12
    if (selectToolRect.right > containerRect.right - parseNum(paddingRight)) {
      Object.assign(this.selectTool.style, {
        left: `${containerRect.right - containerRect.left - selectToolRect.width - parseNum(paddingRight) - 1 - 12}px`,
        transform: `translate(0%, 20%)`,
      });
    }
    else if (selectToolRect.left < parseNum(paddingLeft)) {
      Object.assign(this.selectTool.style, {
        left: `${parseNum(paddingLeft) + 1 + 12}px`,
        transform: `translate(0%, 20%)`,
      });
    }
  };
}
