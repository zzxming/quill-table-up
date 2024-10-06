import type Quill from 'quill';
import type { TableCellInnerFormat, TableUp } from '..';
import type { TableMenuOptions, TableMenuTexts, Tool, ToolOption } from '../utils';
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
import { createToolTip, debounce, isArray, isFunction, limitDomInViewPort, randomId } from '../utils';

const usedColors = new Set<string>();

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

type TableMenuOptionsInput = Partial<Omit<TableMenuOptions, 'texts'> & { texts?: Partial<TableMenuTexts> }>;
export class TableMenu {
  options: TableMenuOptions;
  menu: HTMLElement | null = null;
  selectedTds: TableCellInnerFormat[] = [];
  updateUsedColor: (this: any, color?: string) => void;
  colorItemClass = `color-${randomId()}`;
  tooltipItem: HTMLElement[] = [];

  constructor(public tableModule: TableUp, public quill: Quill, options: TableMenuOptionsInput) {
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
          colorItem.classList.add('table-color-item');
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

  resolveOptions(options: TableMenuOptionsInput) {
    return Object.assign({
      tipText: true,
      tipTexts: {},
      tools: defaultTools,
      localstorageKey: '__table-bg-used-color',
      contextmenu: false,
      defaultColorMap: [
        [
          'rgb(255, 255, 255)',
          'rgb(0, 0, 0)',
          'rgb(72, 83, 104)',
          'rgb(41, 114, 244)',
          'rgb(0, 163, 245)',
          'rgb(49, 155, 98)',
          'rgb(222, 60, 54)',
          'rgb(248, 136, 37)',
          'rgb(245, 196, 0)',
          'rgb(153, 56, 215)',
        ],
        [
          'rgb(242, 242, 242)',
          'rgb(127, 127, 127)',
          'rgb(243, 245, 247)',
          'rgb(229, 239, 255)',
          'rgb(229, 246, 255)',
          'rgb(234, 250, 241)',
          'rgb(254, 233, 232)',
          'rgb(254, 243, 235)',
          'rgb(254, 249, 227)',
          'rgb(253, 235, 255)',
        ],
        [
          'rgb(216, 216, 216)',
          'rgb(89, 89, 89)',
          'rgb(197, 202, 211)',
          'rgb(199, 220, 255)',
          'rgb(199, 236, 255)',
          'rgb(195, 234, 213)',
          'rgb(255, 201, 199)',
          'rgb(255, 220, 196)',
          'rgb(255, 238, 173)',
          'rgb(242, 199, 255)',
        ],
        [
          'rgb(191, 191, 191)',
          'rgb(63, 63, 63)',
          'rgb(128, 139, 158)',
          'rgb(153, 190, 255)',
          'rgb(153, 221, 255)',
          'rgb(152, 215, 182)',
          'rgb(255, 156, 153)',
          'rgb(255, 186, 132)',
          'rgb(255, 226, 112)',
          'rgb(213, 142, 255)',
        ],
        [
          'rgb(165, 165, 165)',
          'rgb(38, 38, 38)',
          'rgb(53, 59, 69)',
          'rgb(20, 80, 184)',
          'rgb(18, 116, 165)',
          'rgb(39, 124, 79)',
          'rgb(158, 30, 26)',
          'rgb(184, 96, 20)',
          'rgb(163, 130, 0)',
          'rgb(94, 34, 129)',
        ],
        [
          'rgb(147, 147, 147)',
          'rgb(13, 13, 13)',
          'rgb(36, 39, 46)',
          'rgb(12, 48, 110)',
          'rgb(10, 65, 92)',
          'rgb(24, 78, 50)',
          'rgb(88, 17, 14)',
          'rgb(92, 48, 10)',
          'rgb(102, 82, 0)',
          'rgb(59, 21, 81)',
        ],
      ],
      texts: this.resolveTexts(options.texts),
    }, options);
  };

  resolveTexts(texts: Partial<TableMenuTexts> = {}) {
    return Object.assign({
      custom: 'Custom',
      clear: 'Clear',
    }, texts);
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

  buildTools() {
    const toolBox = document.createElement('div');
    toolBox.classList.add('ql-table-menu');
    document.body.appendChild(toolBox);
    if (this.options.contextmenu) {
      toolBox.classList.add('contextmenu');
    }
    Object.assign(toolBox.style, { display: 'flex' });
    for (const tool of this.options.tools) {
      const { name, icon, handle, isColorChoose, tip = '' } = tool as ToolOption;
      const item = document.createElement('span');
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
          const colorSelectWrapper = document.createElement('div');
          colorSelectWrapper.classList.add('table-color-select-wrapper');

          if (this.options.defaultColorMap.length > 0) {
            const colorMap = document.createElement('div');
            colorMap.classList.add('table-color-map');
            for (const colors of this.options.defaultColorMap) {
              const colorMapRow = document.createElement('div');
              colorMapRow.classList.add('table-color-map-row');
              for (const color of colors) {
                const colorItem = document.createElement('div');
                colorItem.classList.add('table-color-item');
                colorItem.style.backgroundColor = color;
                colorMapRow.appendChild(colorItem);
              }
              colorMap.appendChild(colorMapRow);
            }
            colorSelectWrapper.appendChild(colorMap);
          }

          const colorMapRow = document.createElement('div');
          colorMapRow.classList.add('table-color-map-row');
          Object.assign(colorMapRow.style, {
            marginTop: '4px',
          });
          const clearColor = document.createElement('div');
          clearColor.textContent = this.options.texts.clear;
          clearColor.addEventListener('click', () => {
            handle(this.tableModule, this.selectedTds, null);
          });
          const label = document.createElement('label');
          const customColor = document.createElement('span');
          customColor.textContent = this.options.texts.custom;
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
          input.addEventListener('input', () => {
            handle(this.tableModule, this.selectedTds, input.value);
            this.updateUsedColor(input.value);
          }, false);
          label.appendChild(customColor);
          label.appendChild(input);
          clearColor.classList.add('table-color-clear');
          label.classList.add('table-color-custom');
          colorMapRow.appendChild(clearColor);
          colorMapRow.appendChild(label);
          colorSelectWrapper.appendChild(colorMapRow);

          if (usedColors.size > 0) {
            const usedColorWrap = document.createElement('div');
            usedColorWrap.classList.add('table-color-used');
            usedColorWrap.classList.add(this.colorItemClass);
            item.appendChild(usedColorWrap);
            for (const recordColor of usedColors) {
              const colorItem = document.createElement('div');
              colorItem.classList.add('table-color-item');
              colorItem.style.backgroundColor = recordColor;
              usedColorWrap.appendChild(colorItem);
            }
            colorSelectWrapper.appendChild(usedColorWrap);
          }

          colorSelectWrapper.addEventListener('click', (e) => {
            const item = e.target as HTMLElement;
            const color = item.style.backgroundColor;
            if (item && color && this.selectedTds.length > 0) {
              this.tableModule.setBackgroundColor(this.selectedTds, color);
              this.updateUsedColor(color);
            }
          });
          const tooltipItem = createToolTip(item, { content: colorSelectWrapper, direction: 'top' });
          tooltipItem && this.tooltipItem.push(tooltipItem);

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
    const style: Record<string, any> = {
      display: 'flex',
      left: 0,
      top: 0,
    };
    if (!this.options.contextmenu) {
      const containerRect = this.quill.container.getBoundingClientRect();
      style.left = containerRect.left + boundary.x + (boundary.width / 2);
      style.top = containerRect.top + boundary.y + boundary.height;
      style.transform = `translate(-50%, 20%)`;
    }
    else {
      if (!position) {
        return this.hideTools();
      }
      const { x, y } = position;
      style.left = x;
      style.top = y;
    }

    Object.assign(this.menu.style, {
      ...style,
      left: `${style.left + window.scrollX}px`,
      top: `${style.top + window.scrollY}px`,
    });

    // limit menu in viewport
    const menuRect = this.menu.getBoundingClientRect();
    const { left: limitLeft, top: limitTop, leftLimited } = limitDomInViewPort(menuRect);
    Object.assign(this.menu.style, {
      left: `${limitLeft + window.scrollX}px`,
      top: `${limitTop + window.scrollY}px`,
      transform: !this.options.contextmenu && leftLimited ? `translate(0%, 20%)` : null,
    });
  }

  destroy() {
    for (const tooltip of this.tooltipItem) tooltip.remove();
    this.quill.root.removeEventListener('contextmenu', this.listenContextmenu);
    if (!this.menu) return;
    this.menu.remove();
    this.menu = null;
  }
}
