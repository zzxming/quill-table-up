import { isString } from '../is';

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
