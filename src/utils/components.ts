import type { TableCreatorTextOptions } from './types';
import {
  autoUpdate,
  computePosition,
  flip,
  limitShift,
  offset,
  shift,
} from '@floating-ui/dom';
import { isString } from './is';
import { handleIfTransitionend } from './utils';

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
interface ButtonOptions {
  type: 'confirm' | 'default';
  content: HTMLElement | string;
};
export const createButton = (options?: Partial<ButtonOptions>) => {
  const { type = 'default', content } = options || {};
  const btn = document.createElement('button');
  btn.classList.add('table-up-btn', type);
  if (content) {
    if (isString(content)) {
      btn.textContent = content;
    }
    else {
      btn.appendChild(content);
    }
  }
  return btn;
};
interface TableCreatorOptions extends Omit<TableCreatorTextOptions, 'customBtnText'> {
  row: number;
  col: number;
}
export const showTableCreator = async (options: Partial<TableCreatorOptions> = {}) => {
  const box = document.createElement('div');
  box.classList.add('table-creator');
  const inputContent = document.createElement('div');
  inputContent.classList.add('table-creator__input');

  const {
    item: rowItem,
    input: rowInput,
    errorTip: rowErrorTip,
  } = createInputItem(options.rowText || 'Row', { type: 'number', value: String(options.row || ''), max: 99 });
  const {
    item: colItem,
    input: colInput,
    errorTip: colErrorTip,
  } = createInputItem(options.colText || 'Column', { type: 'number', value: String(options.col || ''), max: 99 });

  inputContent.appendChild(rowItem);
  inputContent.appendChild(colItem);
  box.appendChild(inputContent);

  const control = document.createElement('div');
  control.classList.add('table-creator__control');

  const confirmBtn = createButton({ type: 'confirm', content: options.confirmText || 'Confirm' });
  const cancelBtn = createButton({ type: 'default', content: options.cancelText || 'Cancel' });

  control.appendChild(confirmBtn);
  control.appendChild(cancelBtn);
  box.appendChild(control);

  const validateInput = (row: number = Number(rowInput.value), col: number = Number(colInput.value)) => {
    if (Number.isNaN(row) || row <= 0) {
      rowErrorTip(options.notPositiveNumberError || 'Please enter a positive integer');
      return;
    }
    if (Number.isNaN(col) || col <= 0) {
      colErrorTip(options.notPositiveNumberError || 'Please enter a positive integer');
      return;
    }
    return { row, col };
  };
  const keyboardClose = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', keyboardClose);
    }
  };

  return new Promise<{ row: number; col: number }>((resolve, reject) => {
    const { close } = createDialog({ child: box, beforeClose: reject });
    rowInput.focus();

    for (const input of [rowInput, colInput]) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const result = validateInput();
          if (result) {
            resolve(result);
            close();
          }
        }
      });
    }
    confirmBtn.addEventListener('click', async () => {
      const result = validateInput();
      if (result) {
        resolve(result);
        close();
      }
    });
    document.addEventListener('keydown', keyboardClose);
    cancelBtn.addEventListener('click', close);
  });
};

interface TableSelectOptions {
  row: number;
  col: number;
  onSelect: (row: number, col: number) => void;
  customBtn: boolean;
  texts: Partial<TableCreatorTextOptions>;
}
export const createSelectBox = (options: Partial<TableSelectOptions> = {}) => {
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
    selectCustom.textContent = texts.customBtnText || 'Custom';
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
  direction?:
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'right'
    | 'right-start'
    | 'right-end'
    | 'left'
    | 'left-start'
    | 'left-end';
  msg?: string;
  delay?: number;
  content?: HTMLElement;
}
const DISTANCE = 4;
let tooltipContainer: HTMLElement;
export interface TooltipInstance {
  destroy: () => void;
};
export const createTooltip = (target: HTMLElement, options: ToolTipOptions = {}): TooltipInstance | null => {
  const { msg = '', delay = 150, content, direction = 'bottom' } = options;
  if (msg || content) {
    if (!tooltipContainer) {
      tooltipContainer = document.createElement('div');
      document.body.appendChild(tooltipContainer);
    }
    const tooltip = document.createElement('div');
    tooltip.classList.add('tooltip', 'hidden', 'transparent');
    if (content) {
      tooltip.appendChild(content);
    }
    else if (msg) {
      tooltip.textContent = msg;
    }
    let timer: ReturnType<typeof setTimeout> | null;
    let cleanup: () => void;
    const update = () => {
      if (cleanup) cleanup();
      computePosition(target, tooltip, {
        placement: direction,
        middleware: [flip(), shift({ limiter: limitShift() }), offset(DISTANCE)],
      }).then(({ x, y }) => {
        Object.assign(tooltip.style, {
          left: `${x}px`,
          top: `${y}px`,
        });
      });
    };
    const transitionendHandler = () => {
      tooltip.classList.add('hidden');
      if (tooltipContainer.contains(tooltip)) {
        tooltipContainer.removeChild(tooltip);
      }
      if (cleanup) cleanup();
    };
    const open = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        tooltipContainer.appendChild(tooltip);
        tooltip.removeEventListener('transitionend', transitionendHandler);
        tooltip.classList.remove('hidden');

        cleanup = autoUpdate(target, tooltip, update);

        tooltip.classList.remove('transparent');
      }, delay);
    };
    const close = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        tooltip.classList.add('transparent');
        handleIfTransitionend(tooltip, 150, transitionendHandler, { once: true });
      }, delay);
    };

    const eventListeners = [target, tooltip];

    for (const listener of eventListeners) {
      listener.addEventListener('mouseenter', open);
      listener.addEventListener('mouseleave', close);
    }

    const destroy = () => {
      for (const listener of eventListeners) {
        listener.removeEventListener('mouseenter', open);
        listener.removeEventListener('mouseleave', close);
      }
      if (cleanup) cleanup();
      tooltip.remove();
    };
    return {
      destroy,
    };
  }
  return null;
};
