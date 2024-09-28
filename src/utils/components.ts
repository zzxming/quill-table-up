import type { TableTextOptions } from './types';
import { limitDomInViewPort } from './utils';

interface InputOptions {
  type?: string;
  value?: string;
  max?: number;
  min?: number;
  [key: string]: any;
};
export const createInputItem = (label: string, options: InputOptions) => {
  options.type || (options.type = 'text');
  options.value || (options.value = '');

  const inputItem = document.createElement('div');
  inputItem.classList.add('input__item');

  if (label) {
    const inputLabel = document.createElement('span');
    inputLabel.classList.add('input__label');
    inputLabel.textContent = label;
    inputItem.appendChild(inputLabel);
  }

  const inputInput = document.createElement('div');
  inputInput.classList.add('input__input');
  const input = document.createElement('input');
  for (const key in options) {
    input.setAttribute(key, options[key]);
  }
  if (options.max || options.min) {
    input.addEventListener('blur', () => {
      if (options.max && options.max <= Number(input.value)) {
        input.value = String(options.max);
      }
      if (options.min && options.min >= Number(input.value)) {
        input.value = String(options.min);
      }
    });
  }

  inputInput.appendChild(input);
  inputItem.appendChild(inputInput);

  input.addEventListener('focus', () => {
    inputInput.classList.add('focus');
  });
  input.addEventListener('blur', () => {
    inputInput.classList.remove('focus');
  });

  const errorTip = (msg: string) => {
    let errorTip: HTMLElement;
    if (inputInput.classList.contains('error')) {
      errorTip = inputInput.querySelector('.input__error-tip')!;
    }
    else {
      errorTip = document.createElement('span');
      errorTip.classList.add('input__error-tip');
      inputInput.appendChild(errorTip);
    }

    errorTip.textContent = msg;
    inputInput.classList.add('error');

    const removeError = () => {
      inputInput.classList.remove('error');
      errorTip.remove();
    };
    return { removeError };
  };

  return { item: inputItem, input, errorTip };
};

interface DialogOptions {
  child?: HTMLElement;
  target?: HTMLElement;
  beforeClose?: () => void;
}
let zindex = 8000;
export const createDialog = ({ child, target = document.body, beforeClose = () => {} }: DialogOptions = {}) => {
  const appendTo = target;
  const dialog = document.createElement('div');
  dialog.classList.add('dialog');
  dialog.style.zIndex = String(zindex);
  const overlay = document.createElement('div');
  overlay.classList.add('dialog__overlay');
  dialog.appendChild(overlay);
  if (child) {
    const content = document.createElement('div');
    content.classList.add('dialog__content');
    content.appendChild(child);
    overlay.appendChild(content);
    content.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  const originOverflow = getComputedStyle(appendTo).overflow;
  appendTo.style.overflow = 'hidden';

  appendTo.appendChild(dialog);
  const close = () => {
    beforeClose();
    dialog.remove();
    appendTo.style.overflow = originOverflow;
  };
  dialog.addEventListener('click', close);
  zindex += 1;

  return { dialog, close };
};

interface TableCreatorOptions extends Omit<TableTextOptions, 'customBtn'> {
  row?: number;
  col?: number;
}
export const showTableCreator = async (options: TableCreatorOptions = {}) => {
  const box = document.createElement('div');
  box.classList.add('table-creator');
  const inputContent = document.createElement('div');
  inputContent.classList.add('table-creator__input');

  const {
    item: rowItem,
    input: rowInput,
    errorTip: rowErrorTip,
  } = createInputItem(options.rowText || '行数', { type: 'number', value: String(options.row || ''), max: 99 });
  const {
    item: colItem,
    input: colInput,
    errorTip: colErrorTip,
  } = createInputItem(options.colText || '列数', { type: 'number', value: String(options.col || ''), max: 99 });

  inputContent.appendChild(rowItem);
  inputContent.appendChild(colItem);
  box.appendChild(inputContent);

  const control = document.createElement('div');
  control.classList.add('table-creator__control');

  const confirmBtn = document.createElement('button');
  confirmBtn.classList.add('table-creator__btn', 'confirm');
  confirmBtn.textContent = options.confirmText || 'Confirm';

  const cancelBtn = document.createElement('button');
  cancelBtn.classList.add('table-creator__btn', 'cancel');
  cancelBtn.textContent = options.cancelText || 'Cancel';

  control.appendChild(confirmBtn);
  control.appendChild(cancelBtn);
  box.appendChild(control);

  return new Promise<{ row: number; col: number }>((resolve, reject) => {
    const { close } = createDialog({ child: box, beforeClose: reject });

    confirmBtn.addEventListener('click', async () => {
      const row = Number(rowInput.value);
      const col = Number(colInput.value);

      if (Number.isNaN(row) || row <= 0) {
        return rowErrorTip(options.notPositiveNumberError || '请输入正整数');
      }
      if (Number.isNaN(col) || col <= 0) {
        return colErrorTip(options.notPositiveNumberError || '请输入正整数');
      }
      resolve({ row, col });
      close();
    });
    cancelBtn.addEventListener('click', () => {
      close();
    });
  });
};

interface TableSelectOptions {
  row?: number;
  col?: number;
  onSelect?: (row: number, col: number) => void;
  customBtn?: boolean;
  texts?: TableTextOptions;
}
export const createSelectBox = (options: TableSelectOptions = {}) => {
  const selectDom = document.createElement('div');
  selectDom.classList.add('select-box');

  const selectBlock = document.createElement('div');
  selectBlock.classList.add('select-box__block');
  for (let r = 0; r < (options.row || 8); r++) {
    for (let c = 0; c < (options.col || 8); c++) {
      const selectItem = document.createElement('div');
      selectItem.classList.add('select-box__item');
      selectItem.dataset.row = String(r + 1);
      selectItem.dataset.col = String(c + 1);
      selectBlock.appendChild(selectItem);
    }
  }
  const updateSelectBlockItems = () => {
    const { row, col } = selectDom.dataset;
    for (const item of Array.from(selectBlock.querySelectorAll('.active'))) {
      item.classList.remove('active');
    }
    if (!row || !col) return;
    const childs = Array.from(selectBlock.children) as HTMLElement[];
    for (let i = 0; i < childs.length; i++) {
      const { row: childRow, col: childCol } = childs[i].dataset;
      if (childRow! > row && childCol! > col) {
        return;
      }
      if (childRow! <= row && childCol! <= col) {
        childs[i].classList.add('active');
      }
      else {
        childs[i].classList.remove('active');
      }
    }
  };
  selectBlock.addEventListener('mousemove', (e) => {
    if (!e.target) return;
    const { row, col } = (e.target as HTMLElement).dataset;
    if (!row || !col) return;
    selectDom.dataset.row = row;
    selectDom.dataset.col = col;
    updateSelectBlockItems();
  });
  selectBlock.addEventListener('mouseleave', () => {
    selectDom.removeAttribute('data-row');
    selectDom.removeAttribute('data-col');
    updateSelectBlockItems();
  });
  selectBlock.addEventListener('click', () => {
    const { row, col } = selectDom.dataset;
    if (!row || !col) return;
    options.onSelect && options.onSelect(Number(row), Number(col));
  });
  selectDom.appendChild(selectBlock);

  if (options.customBtn) {
    const texts = options.texts || {};
    const selectCustom = document.createElement('div');
    selectCustom.classList.add('select-box__custom');
    selectCustom.textContent = texts.customBtnText || '自定义行列数';
    selectCustom.addEventListener('click', async () => {
      const res = await showTableCreator(texts);
      if (res) {
        options.onSelect && options.onSelect(res.row, res.col);
      }
    });
    selectDom.appendChild(selectCustom);
  }

  return selectDom;
};

interface ToolTipOptions {
  direction?: 'top' | 'right' | 'bottom' | 'left';
  msg?: string;
  delay?: number;
  content?: HTMLElement;
}
const DISTANCE = 8;
let tooltipContainer: HTMLElement;
export const createToolTip = (target: HTMLElement, options: ToolTipOptions = {}) => {
  const { msg = '', delay = 150, content, direction = 'bottom' } = options;
  if (msg || content) {
    if (!tooltipContainer) {
      tooltipContainer = document.createElement('div');
      document.body.appendChild(tooltipContainer);
    }
    const tooltip = document.createElement('div');
    tooltip.classList.add('tooltip');
    tooltip.classList.add('hidden');
    tooltip.classList.add('transparent');
    if (content) {
      tooltip.appendChild(content);
    }
    else if (msg) {
      tooltip.textContent = msg;
    }
    let timer: ReturnType<typeof setTimeout> | null;

    const transitionendHandler = () => {
      tooltip.classList.add('hidden');
      tooltipContainer.removeChild(tooltip);
    };
    const open = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        tooltipContainer.appendChild(tooltip);
        tooltip.removeEventListener('transitionend', transitionendHandler);
        tooltip.classList.remove('hidden');
        const elRect = target.getBoundingClientRect();
        const contentRect = tooltip.getBoundingClientRect();
        const extraPositionMap = {
          top: {
            top: -contentRect.height - DISTANCE,
            left: elRect.width / 2 - contentRect.width / 2,
          },
          right: {
            top: elRect.height / 2 - contentRect.height / 2,
            left: elRect.width + DISTANCE,
          },
          bottom: {
            top: contentRect.height + DISTANCE,
            left: elRect.width / 2 - contentRect.width / 2,
          },
          left: {
            top: elRect.height / 2 - contentRect.height / 2,
            left: -contentRect.width - DISTANCE,

          },
        } as const;
        const extra = extraPositionMap[direction];
        let top = window.scrollY + elRect.top + extra.top;
        let left = window.scrollX + elRect.left + extra.left;
        Object.assign(tooltip.style, {
          top: `${top}px`,
          left: `${left}px`,
        });
        ({ top, left } = limitDomInViewPort(tooltip.getBoundingClientRect()));
        Object.assign(tooltip.style, {
          top: `${top}px`,
          left: `${left}px`,
        });
        tooltip.classList.remove('transparent');
      }, delay);
    };
    const close = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        tooltip.classList.add('transparent');
        tooltip.addEventListener('transitionend', transitionendHandler, { once: true });
        // handle remove when transition set none
        setTimeout(() => {
          transitionendHandler();
        }, 150);
      }, delay);
    };
    target.addEventListener('mouseenter', open);
    target.addEventListener('mouseleave', close);
    tooltip.addEventListener('mouseenter', open);
    tooltip.addEventListener('mouseleave', close);
    return tooltip;
  }
  return null;
};
