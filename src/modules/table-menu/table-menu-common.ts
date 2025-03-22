import type { TableUp } from '../../table-up';
import type { TableMenuOptions, ToolOption, TooltipInstance, ToolTipOptions } from '../../utils';
import Quill from 'quill';
import { createBEM, createColorPicker, createTooltip, debounce, defaultColorMap, isArray, isFunction, randomId } from '../../utils';
import { colorClassName, defaultTools, maxSaveColorCount, menuColorSelectClassName, usedColors } from './constants';

export type TableMenuOptionsInput = Partial<Omit<TableMenuOptions, 'texts'>>;
export interface MenuTooltipInstance extends TooltipInstance {
  isColorPick?: boolean;
}
export class TableMenuCommon {
  options: TableMenuOptions;
  menu: HTMLElement | null = null;
  isMenuDisplay: boolean = false;
  isColorPicking: boolean = false;
  updateUsedColor: (this: any, color?: string) => void;
  tooltipItem: MenuTooltipInstance[] = [];
  activeTooltip: MenuTooltipInstance | null = null;
  bem = createBEM('menu');
  colorItemClass = `color-${randomId()}`;
  colorChooseTooltipOption: ToolTipOptions = {
    direction: 'top',
  };

  constructor(public tableModule: TableUp, public quill: Quill, options: TableMenuOptionsInput) {
    this.options = this.resolveOptions(options);

    try {
      const storageValue = localStorage.getItem(this.options.localstorageKey) || '[]';
      let colorValue = JSON.parse(storageValue);
      if (!isArray(colorValue)) {
        colorValue = [];
      }
      colorValue.slice(-1 * maxSaveColorCount).map((c: string) => usedColors.add(c));
    }
    catch {}

    this.updateUsedColor = debounce((color?: string) => {
      if (!color) return;
      usedColors.add(color);
      if (usedColors.size > maxSaveColorCount) {
        const saveColors = Array.from(usedColors).slice(-1 * maxSaveColorCount);
        usedColors.clear();
        saveColors.map(v => usedColors.add(v));
      }

      localStorage.setItem(this.options.localstorageKey, JSON.stringify(Array.from(usedColors)));
      const usedColorWrappers = Array.from(document.querySelectorAll(`.${this.colorItemClass}.${colorClassName.used}`));
      for (const usedColorWrapper of usedColorWrappers) {
        const newColorItem = document.createElement('div');
        newColorItem.classList.add(colorClassName.item);
        newColorItem.style.backgroundColor = String(color);
        // if already have same color item. doesn't need insert
        const sameColorItem = Array.from(usedColorWrapper.querySelectorAll(`.${colorClassName.item}[style*="background-color: ${newColorItem.style.backgroundColor}"]`));
        if (sameColorItem.length <= 0) {
          usedColorWrapper.appendChild(newColorItem);
        }

        const colorItem = Array.from(usedColorWrapper.querySelectorAll(`.${colorClassName.item}`)).slice(0, -1 * maxSaveColorCount);
        for (const item of colorItem) {
          item.remove();
        }
      }
    }, 1000);
    this.quill.on(Quill.events.TEXT_CHANGE, this.updateWhenTextChange);
  }

  updateWhenTextChange = () => {
    if (this.isMenuDisplay) {
      this.update();
    }
  };

  resolveOptions(options: TableMenuOptionsInput) {
    const value = Object.assign({
      tipText: true,
      tools: defaultTools,
      localstorageKey: '__table-bg-used-color',
      defaultColorMap,
    }, options);
    return value as TableMenuOptions;
  }

  getUsedColors() {
    return usedColors;
  }

  buildTools(): HTMLElement {
    const toolBox = document.createElement('div');
    toolBox.classList.add(this.bem.b());
    Object.assign(toolBox.style, { display: 'flex' });
    for (const tool of this.options.tools) {
      const { name, icon, handle, isColorChoose, key: attrKey, tip = '' } = tool as ToolOption;
      const item = document.createElement('span');
      item.classList.add(this.bem.be('item'));
      if (name === 'break') {
        item.classList.add(this.bem.is('break'));
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

        if (isColorChoose && attrKey) {
          const tooltipItem = this.createColorChoose(item, { name, icon, handle, isColorChoose, key: attrKey, tip });
          this.tooltipItem.push(tooltipItem);
          item.classList.add(menuColorSelectClassName);
        }
        else {
          isFunction(handle) && item.addEventListener('click', (e) => {
            this.quill.focus();
            handle(this.tableModule, this.getSelectedTds(), e);
          }, false);
        }

        // add text
        const tipText = this.tableModule.options.texts[name] || tip;
        if (this.options.tipText && tipText && tip) {
          this.createTipText(item, tipText);
        }
      }
      toolBox.appendChild(item);
    }
    return toolBox;
  }

  createColorChoose(item: HTMLElement, { handle, key }: ToolOption) {
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
    transparentColor.classList.add(colorClassName.btn, 'transparent');
    transparentColor.textContent = this.tableModule.options.texts.transparent;
    transparentColor.addEventListener('click', () => {
      handle(this.tableModule, this.getSelectedTds(), 'transparent');
    });
    const clearColor = document.createElement('div');
    clearColor.classList.add(colorClassName.btn, 'clear');
    clearColor.textContent = this.tableModule.options.texts.clear;
    clearColor.addEventListener('click', () => {
      handle(this.tableModule, this.getSelectedTds(), null);
    });
    const customColor = document.createElement('div');
    customColor.classList.add(colorClassName.btn, 'custom');
    customColor.textContent = this.tableModule.options.texts.custom;
    const colorPicker = createColorPicker({
      onChange: (color) => {
        handle(this.tableModule, this.getSelectedTds(), color);
        this.updateUsedColor(color);
      },
    });
    const { hide: hideColorPicker, destroy: destroyColorPicker } = createTooltip(customColor, {
      direction: 'right',
      type: 'click',
      content: colorPicker,
      container: customColor,
    })!;

    colorMapRow.appendChild(transparentColor);
    colorMapRow.appendChild(clearColor);
    colorMapRow.appendChild(customColor);
    colorSelectWrapper.appendChild(colorMapRow);

    const usedColorWrap = document.createElement('div');
    usedColorWrap.classList.add(colorClassName.used, this.colorItemClass);
    for (const recordColor of usedColors) {
      const colorItem = document.createElement('div');
      colorItem.classList.add(colorClassName.item);
      colorItem.style.backgroundColor = recordColor;
      usedColorWrap.appendChild(colorItem);
    }
    colorSelectWrapper.appendChild(usedColorWrap);

    colorSelectWrapper.addEventListener('click', (e) => {
      e.stopPropagation();
      hideColorPicker();
      const item = e.target as HTMLElement;
      const color = item.style.backgroundColor;
      const selectedTds = this.getSelectedTds();
      if (item && color && selectedTds.length > 0) {
        this.tableModule.setCellAttrs(selectedTds, key!, color, true);
        if (!item.closest(`.${colorClassName.item}`)) return;
        this.updateUsedColor(color);
      }
    });

    // get tooltip instance. makesure color picker only display one at time
    const tooltip: MenuTooltipInstance = createTooltip(item, {
      content: colorSelectWrapper,
      onOpen: () => {
        if (this.isMenuDisplay && this.tableModule.tableSelection) {
          this.tableModule.tableSelection.hideDisplay();
        }
        this.setActiveTooltip(tooltip);
        return false;
      },
      onClose: () => {
        if (this.isMenuDisplay && this.tableModule.tableSelection) {
          this.tableModule.tableSelection.updateWithSelectedTds();
          this.tableModule.tableSelection.showDisplay();
        }
        const isChild = colorSelectWrapper.contains(colorPicker);
        if (isChild) {
          hideColorPicker();
        }
        if (this.activeTooltip === tooltip) {
          this.activeTooltip = null;
        }
        return false;
      },
      onDestroy: () => {
        destroyColorPicker();
        if (this.activeTooltip === tooltip) {
          this.activeTooltip = null;
        }
      },
      ...this.colorChooseTooltipOption,
    })!;
    tooltip.isColorPick = true;
    return tooltip;
  }

  setActiveTooltip(tooltip: MenuTooltipInstance | null) {
    if (this.activeTooltip && this.activeTooltip !== tooltip) {
      this.activeTooltip.hide(true);
    }
    this.activeTooltip = tooltip;
  }

  getSelectedTds() {
    return this.tableModule.tableSelection?.selectedTds || [];
  }

  createTipText(item: HTMLElement, text: string) {
    const tipTextDom = createTooltip(item, { msg: text });
    tipTextDom && this.tooltipItem.push(tipTextDom);
  }

  show() {
    if (!this.menu || !this.tableModule.tableSelection || !this.tableModule.tableSelection.boundary) return;
    Object.assign(this.menu.style, { display: 'flex' });
    this.isMenuDisplay = true;
    this.update();
  }

  update() {
  }

  hide() {
    this.menu && Object.assign(this.menu.style, { display: 'none' });
    for (const tooltip of this.tooltipItem) {
      tooltip.hide(true);
    }
    this.isMenuDisplay = false;
  }

  destroy() {
    this.quill.off(Quill.events.TEXT_CHANGE, this.updateWhenTextChange);
    this.activeTooltip = null;
    for (const tooltip of this.tooltipItem) tooltip.destroy();
    if (!this.menu) return;
    this.hide();
    this.menu.remove();
    this.menu = null;
  }
}
