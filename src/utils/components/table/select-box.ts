import type { TableCreatorTextOptions } from '../../types';
import { showTableCreator } from './creator';

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
