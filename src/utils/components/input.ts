import { createBEM } from '../bem';

interface InputOptions {
  type?: string;
  value?: string;
  max?: number;
  min?: number;
  [key: string]: any;
}
export function createInputItem(label: string, options: InputOptions) {
  const bem = createBEM('input');
  options.type || (options.type = 'text');
  options.value || (options.value = '');

  const inputItem = document.createElement('div');
  inputItem.classList.add(bem.be('item'));

  if (label) {
    const inputLabel = document.createElement('span');
    inputLabel.classList.add(bem.be('label'));
    inputLabel.textContent = label;
    inputItem.appendChild(inputLabel);
  }

  const inputInput = document.createElement('div');
  inputInput.classList.add(bem.be('input'));
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
      errorTip = inputInput.querySelector(`.${bem.be('error-tip')}`)!;
    }
    else {
      errorTip = document.createElement('span');
      errorTip.classList.add(bem.be('error-tip'));
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
}
