import Quill from 'quill';
import { createSelectBox, isFunction } from './utils';
import { BlockBackground, TableSelection } from './modules';
import type { AnyClass, TableUpOptions } from './utils';

const icons = Quill.import('ui/icons') as Record<string, any>;
const TableModule = Quill.import('modules/table') as AnyClass & { register: () => void };
const toolName = 'table';

export default class TableUp extends TableModule {
  static register() {
    super.register();
    Quill.register({
      'formats/block-background-color': BlockBackground,
    }, true);
  }

  constructor(quill: Quill, options: TableUpOptions) {
    super(quill, options);
    this.options = this.resolveOptions(options || {});

    const toolbar = this.quill.getModule('toolbar');
    const [, select] = (toolbar.controls as [string, HTMLElement][] || []).find(([name]) => name === toolName) || [];
    if (select && select.tagName.toLocaleLowerCase() === 'select') {
      this.picker = this.quill.theme.pickers.find((picker: any) => picker.select === select);
      if (!this.picker) return;
      this.picker.label.innerHTML = icons.table;
      this.buildCustomSelect(this.options.customSelect);
      this.picker.label.addEventListener('mousedown', this.handleInViewport);
    }

    this.selection = new TableSelection(this, this.quill, this.options.selection);
  }

  handleInViewport = () => {
    const selectRect = this.selector.getBoundingClientRect();
    if (selectRect.right >= window.innerWidth) {
      const labelRect = this.picker.label.getBoundingClientRect();
      this.picker.options.style.transform = `translateX(calc(-100% + ${labelRect.width}px))`;
    }
    else {
      this.picker.options.style.transform = undefined;
    }
  };

  resolveOptions = (options: Record<string, any>) => {
    return Object.assign({
      isCustom: true,
      texts: this.resolveTexts(options.texts || {}),
    }, options);
  };

  resolveTexts = (options: Record<string, string>) => {
    return Object.assign({
      customBtn: '自定义行列数',
      confirmText: '确认',
      cancelText: '取消',
      rowText: '行数',
      colText: '列数',
      notPositiveNumberError: '请输入正整数',
    }, options);
  };

  buildCustomSelect = async (customSelect: HTMLElement) => {
    const dom = document.createElement('div');
    dom.classList.add('ql-custom-select');
    this.selector = customSelect && isFunction(customSelect) ? await customSelect(this) : this.createSelect();
    dom.appendChild(this.selector);
    this.picker.options.appendChild(dom);
  };

  createSelect = () => {
    return createSelectBox({
      onSelect: (row: number, col: number) => {
        this.insertTable(row, col);
        this.picker.close();
      },
      isCustom: this.options.isCustom,
      texts: this.options.texts,
    });
  };

  setBackgroundColor = (color: string) => {
    const range = this.quill.getSelection();
    if (!range) return;
    const cell = this.getTable(range)[2];
    if (cell === null) return;
    cell.format('block-background-color', color);
  };

  insertTable = (rows: number, columns: number) => {
    this.quill.focus();
    super.insertTable(rows, columns);
  };
}

export * from './modules';
