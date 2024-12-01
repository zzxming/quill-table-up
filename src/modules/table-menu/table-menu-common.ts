import type Quill from 'quill';
import type { TableUp } from '../..';
import type { TableMenuOptions, ToolOption, TooltipInstance } from '../../utils';
import { createTooltip, debounce, defaultColorMap, isArray, isFunction, randomId } from '../../utils';
import { colorClassName, defaultTools, menuColorSelectClassName, usedColors } from './constants';

export type TableMenuOptionsInput = Partial<Omit<TableMenuOptions, 'texts'>>;
export class TableMenuCommon {
  options: TableMenuOptions;
  menu: HTMLElement | null = null;
  updateUsedColor: (this: any, color?: string) => void;
  colorItemClass = `color-${randomId()}`;
  tooltipItem: TooltipInstance[] = [];

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
      if (!color) return;
      usedColors.add(color);
      if (usedColors.size > 10) {
        const saveColors = Array.from(usedColors).slice(-10);
        usedColors.clear();
        saveColors.map(v => usedColors.add(v));
      }

      localStorage.setItem(this.options.localstorageKey, JSON.stringify(Array.from(usedColors)));
      const usedColorWrappers = Array.from(document.querySelectorAll(`.${this.colorItemClass}.${colorClassName.used}`));
      for (const usedColorWrapper of usedColorWrappers) {
        if (!usedColorWrapper) continue;

        const colorItem = usedColorWrapper.querySelectorAll(`.${colorClassName.item}[style*="background-color: ${color}"]`);
        for (const item of Array.from(colorItem)) {
          item.remove();
        }

        const newColorItem = document.createElement('div');
        newColorItem.classList.add(colorClassName.item);
        newColorItem.style.backgroundColor = String(color);
        usedColorWrapper.appendChild(newColorItem);
      }
    }, 1000);
  }

  resolveOptions(options: TableMenuOptionsInput) {
    const value = Object.assign({
      tipText: true,
      tipTexts: {},
      tools: defaultTools,
      localstorageKey: '__table-bg-used-color',
      defaultColorMap,
    }, options);
    return value as TableMenuOptions;
  };

  getUsedColors() {
    return usedColors;
  }

  buildTools(): HTMLElement {
    const toolBox = document.createElement('div');
    toolBox.classList.add('ql-table-menu');
    Object.assign(toolBox.style, { display: 'flex' });
    for (const tool of this.options.tools) {
      const { name, icon, handle, isColorChoose, key: attrKey, tip = '' } = tool as ToolOption;
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
        if (isColorChoose && attrKey) {
          const colorSelectWrapper = this.createColorChoose({ name, icon, handle, isColorChoose, key: attrKey, tip });
          const tooltipItem = createTooltip(item, { content: colorSelectWrapper, direction: 'top' });
          tooltipItem && this.tooltipItem.push(tooltipItem);
          item.classList.add(menuColorSelectClassName);
        }
        else {
          isFunction(handle) && item.addEventListener('click', (e) => {
            this.quill.focus();
            handle(this.tableModule, this.getSelectedTds(), e);
          }, false);
        }

        // add text
        const tipText = this.options.tipTexts[name] || tip;
        if (this.options.tipText && tipText && tip) {
          this.createTipText(item, tipText);
        }
      }
      toolBox.appendChild(item);
    }
    return toolBox;
  };

  createColorChoose({ handle, key }: ToolOption) {
    const colorSelectWrapper = document.createElement('div');
    colorSelectWrapper.classList.add(colorClassName.selectWrapper);

    if (this.options.defaultColorMap.length > 0) {
      const colorMap = document.createElement('div');
      colorMap.classList.add(colorClassName.map);
      for (const colors of this.options.defaultColorMap) {
        const colorMapRow = document.createElement('div');
        colorMapRow.classList.add(colorClassName.mapRow);
        for (const color of colors) {
          const colorItem = document.createElement('div');
          colorItem.classList.add(colorClassName.item);
          colorItem.style.backgroundColor = color;
          colorMapRow.appendChild(colorItem);
        }
        colorMap.appendChild(colorMapRow);
      }
      colorSelectWrapper.appendChild(colorMap);
    }

    const colorMapRow = document.createElement('div');
    colorMapRow.classList.add(colorClassName.mapRow);
    Object.assign(colorMapRow.style, {
      marginTop: '4px',
    });
    const transparentColor = document.createElement('div');
    transparentColor.classList.add(colorClassName.btn, 'table-color-transparent');
    transparentColor.textContent = this.tableModule.options.texts.transparent;
    transparentColor.addEventListener('click', () => {
      handle(this.tableModule, this.getSelectedTds(), 'transparent');
    });
    const clearColor = document.createElement('div');
    clearColor.classList.add(colorClassName.btn, 'table-color-clear');
    clearColor.textContent = this.tableModule.options.texts.clear;
    clearColor.addEventListener('click', () => {
      handle(this.tableModule, this.getSelectedTds(), null);
    });
    const label = document.createElement('label');
    label.classList.add(colorClassName.btn, 'table-color-custom');
    const customColor = document.createElement('span');
    customColor.textContent = this.tableModule.options.texts.custom;
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
      handle(this.tableModule, this.getSelectedTds(), input.value);
      this.updateUsedColor(input.value);
    }, false);
    label.appendChild(customColor);
    label.appendChild(input);

    colorMapRow.appendChild(transparentColor);
    colorMapRow.appendChild(clearColor);
    colorMapRow.appendChild(label);
    colorSelectWrapper.appendChild(colorMapRow);

    if (usedColors.size > 0) {
      const usedColorWrap = document.createElement('div');
      usedColorWrap.classList.add(colorClassName.used, this.colorItemClass);
      for (const recordColor of usedColors) {
        const colorItem = document.createElement('div');
        colorItem.classList.add(colorClassName.item);
        colorItem.style.backgroundColor = recordColor;
        usedColorWrap.appendChild(colorItem);
      }
      colorSelectWrapper.appendChild(usedColorWrap);
    }

    colorSelectWrapper.addEventListener('click', (e) => {
      const item = e.target as HTMLElement;
      const color = item.style.backgroundColor;
      const selectedTds = this.getSelectedTds();
      if (item && color && selectedTds.length > 0) {
        this.tableModule.setCellAttrs(selectedTds, key!, color, true);
        if (item.closest(`.${colorClassName.item}`)) return;
        this.updateUsedColor(color);
      }
    });
    return colorSelectWrapper;
  }

  getSelectedTds() {
    return this.tableModule.tableSelection?.selectedTds || [];
  }

  createTipText(item: HTMLElement, text: string) {
    const tipTextDom = createTooltip(item, { msg: text });
    tipTextDom && this.tooltipItem.push(tipTextDom);
  }

  updateTools() {
    if (!this.menu || !this.tableModule.tableSelection || !this.tableModule.tableSelection.boundary) return;
    Object.assign(this.menu.style, { display: 'flex' });
  }

  hideTools() {
    this.menu && Object.assign(this.menu.style, { display: 'none' });
  }

  destroy() {
    for (const tooltip of this.tooltipItem) tooltip.destroy();
    if (!this.menu) return;
    this.menu.remove();
    this.menu = null;
  }
}
