import { createBEM } from '../bem';

interface DialogOptions {
  child?: HTMLElement;
  target?: HTMLElement;
  beforeClose?: () => void;
}
let zindex = 8000;
export const createDialog = ({ child, target = document.body, beforeClose = () => {} }: DialogOptions = {}) => {
  const bem = createBEM('dialog');
  const appendTo = target;
  const dialog = document.createElement('div');
  dialog.classList.add(bem.b());
  dialog.style.zIndex = String(zindex);
  const overlay = document.createElement('div');
  overlay.classList.add(bem.be('overlay'));
  dialog.appendChild(overlay);
  if (child) {
    const content = document.createElement('div');
    content.classList.add(bem.be('content'));
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
