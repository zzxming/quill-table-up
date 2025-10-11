import { createBEM } from '../bem';
import { createButton } from './button';

interface DialogOptions {
  child?: HTMLElement;
  target?: HTMLElement;
  beforeClose?: () => void;
}
let zindex = 8000;
export function createDialog({ child, target = document.body, beforeClose = () => {} }: DialogOptions = {}) {
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
}

export async function createConfirmDialog({ message, confirm, cancel }: {
  message: string;
  confirm: string;
  cancel: string;
}) {
  return new Promise<boolean>((resolve) => {
    const content = document.createElement('div');
    Object.assign(content.style, {
      padding: '8px 12px',
      fontSize: '14px',
      lineHeight: '1.5',
    });
    const tip = document.createElement('p');
    tip.textContent = message;
    const btnWrapper = document.createElement('div');
    Object.assign(btnWrapper.style, {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: `6px`,
    });
    const cancelBtn = createButton({ content: cancel });
    const confirmBtn = createButton({ type: 'confirm', content: confirm });

    btnWrapper.appendChild(cancelBtn);
    btnWrapper.appendChild(confirmBtn);
    content.appendChild(tip);
    content.appendChild(btnWrapper);

    const { close } = createDialog({ child: content });

    cancelBtn.addEventListener('click', () => {
      resolve(false);
      close();
    });
    confirmBtn.addEventListener('click', () => {
      resolve(true);
      close();
    });
  });
}
