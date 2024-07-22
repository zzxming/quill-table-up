import type { Parchment } from 'quill';
import Quill from 'quill';
import type { AnyClass, TableSelectionOptions, Tool, ToolOption } from '../utils';
import { createToolTip, isFunction } from '../utils';

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
    name: 'Background',
    icon: `<label class="table-color-picker" style="display: flex">${Color}</label>`,
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
        });
        input.addEventListener('input', () => {
          tableModule.setBackgroundColor(input.value);
        });
        label.appendChild(input);
      }
    },
  },
];

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

    this.cellSelect = this.quill.addContainer('ql-table-selection');
    this.selectTool = this.buildTools();

    this.quill.root.addEventListener('scroll', this.destory);
    this.quill.on(Quill.events.EDITOR_CHANGE, () => {
      this.updateSelectBox();
    });
  }

  resolveOptions = (options: Partial<TableSelectionOptions>) => {
    return Object.assign({
      selectColor: '#0589f3',
      tools: defaultTools,
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
        item.innerHTML = icon!;
        if (isFunction(handle)) {
          item.addEventListener('click', (e) => {
            this.quill.focus();
            handle(this.tableModule, e);
          });
        }
        if (tip) {
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
    if (!this.selectTd) return this.destory();
    const containerRect = this.quill.container.getBoundingClientRect();
    this.boundary = getRelativeRect(this.selectTd.domNode.getBoundingClientRect(), containerRect);

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
        transform: `translate(0%, 100%)`,
      });
    }
    else if (selectToolRect.left < parseNum(paddingLeft)) {
      Object.assign(this.selectTool.style, {
        left: `${parseNum(paddingLeft) + 1 + 12}px`,
        transform: `translate(0%, 100%)`,
      });
    }
  };
}
