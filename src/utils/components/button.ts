import { createBEM } from '../bem';
import { isString } from '../is';

interface ButtonOptions {
  type: 'confirm' | 'default';
  content: HTMLElement | string;
}
export const createButton = (options?: Partial<ButtonOptions>) => {
  const { type = 'default', content } = options || {};
  const bem = createBEM('button');
  const btn = document.createElement('button');
  btn.classList.add(bem.b(), type);
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
