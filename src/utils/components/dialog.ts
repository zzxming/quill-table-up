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
