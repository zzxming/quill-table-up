import type { TableCreatorTextOptions } from '../../types';
import { createBEM } from '../../bem';
import { createButton } from '../button';
import { createDialog } from '../dialog';
import { createInputItem } from '../input';

interface TableCreatorOptions extends Omit<TableCreatorTextOptions, 'customBtnText'> {
  row: number;
  col: number;
}
export async function showTableCreator(options: Partial<TableCreatorOptions> = {}) {
  const bem = createBEM('creator');
  const box = document.createElement('div');
  box.classList.add(bem.b());
  const inputContent = document.createElement('div');
  inputContent.classList.add(bem.be('input'));

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
  control.classList.add(bem.be('control'));

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
    confirmBtn.addEventListener('click', () => {
      const result = validateInput();
      if (result) {
        resolve(result);
        close();
      }
    });
    document.addEventListener('keydown', keyboardClose);
    cancelBtn.addEventListener('click', close);
  })
    .finally(() => {
      document.removeEventListener('keydown', keyboardClose);
    });
}
