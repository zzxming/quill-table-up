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
import type TableUp from '..';

const TableFormat = Quill.import('formats/table') as AnyClass;

const defaultTools: Tool[] = [
  {
    name: 'InsertTop',
    icon: InsertTop,
    tip: '向上插入一行',
    handle: (tableModule: TableUp) => {
      tableModule.insertRow(0);
    },
  },
  {
    name: 'InsertRight',
    icon: InsertRight,
    tip: '向右插入一列',
    handle: (tableModule: TableUp) => {
      tableModule.insertColumn(1);
    },
  },
  {
    name: 'InsertBottom',
    icon: InsertBottom,
    tip: '向下插入一行',
    handle: (tableModule: TableUp) => {
      tableModule.insertRow(1);
    },
  },
  {
    name: 'InsertLeft',
    icon: InsertLeft,
    tip: '向左插入一列',
    handle: (tableModule: TableUp) => {
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
    handle: (tableModule: TableUp) => {
      tableModule.deleteRow();
    },
  },
  {
    name: 'DeleteColumn',
    icon: RemoveColumn,
    tip: '删除当前列',
    handle: (tableModule: TableUp) => {
      tableModule.deleteColumn();
    },
  },
  {
    name: 'DeleteTable',
    icon: RemoveTable,
    tip: '删除当前表格',
    handle: (tableModule: TableUp) => {
      tableModule.deleteTable();
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

    this.cellSelect = this.quill.addContainer('ql-table-selection');
    this.selectTool = this.buildTools();

    this.quill.root.addEventListener('mousedown', this.destory);
    this.quill.root.addEventListener('scroll', this.destory);
    this.quill.on(Quill.events.EDITOR_CHANGE, (name, range, _oldRange, _source) => {
      if (name === Quill.events.SELECTION_CHANGE && range) {
        const [blot] = this.quill.scroll.descendant(TableFormat, range.index);
        if (!blot) return;
        this.selectTd = blot;
        this.updateSelectBox();
      }
      else {
        this.destory();
      }
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
          item.addEventListener('click', () => {
            this.quill.focus();
            handle(this.tableModule);
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
    if (!this.selectTd) return;
    this.boundary = this.getRelativeRect(this.selectTd.domNode.getBoundingClientRect(), this.quill.container.getBoundingClientRect());

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
      top: `${this.boundary.y - 1}px`,
      transform: `translate(-50%, 100%)`,
    });
  };

  getRelativeRect = (targetRect: DOMRect, containerRect: DOMRect) => ({
    x: targetRect.x - containerRect.x,
    y: targetRect.y - containerRect.y,
    width: targetRect.width,
    height: targetRect.height,
  });
}
