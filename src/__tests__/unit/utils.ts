import type { TableColValue } from '../../index';
import Quill from 'quill';
import { expect, vi } from 'vitest';
import TableUp from '../../index';

// eslint-disable-next-line unicorn/prefer-string-replace-all
export const normalizeHTML = (html: string | { html: string }) => typeof html === 'object' ? html.html : html.replace(/\n\s*/g, '');
export const sortAttributes = (element: HTMLElement) => {
  const attributes = Array.from(element.attributes);
  const sortedAttributes = attributes.sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  while (element.attributes.length > 0) {
    element.removeAttribute(element.attributes[0].name);
  }

  for (const attr of sortedAttributes) {
    element.setAttribute(attr.name, attr.value);
  }

  // eslint-disable-next-line unicorn/no-array-for-each
  element.childNodes.forEach((child) => {
    if (child instanceof HTMLElement) {
      sortAttributes(child);
    }
  });
};
export const createQuillWithTableModule = (html: string, options = {}, moduleOptions = {}, register = {}) => {
  Quill.register({
    [`modules/${TableUp.moduleName}`]: TableUp,
    ...register,
  }, true);
  const container = document.body.appendChild(document.createElement('div'));
  container.innerHTML = normalizeHTML(html);
  const quill = new Quill(container, {
    modules: {
      [TableUp.moduleName]: {
        full: true,
        ...options,
      },
      history: {
        delay: 0,
      },
      ...moduleOptions,
    },
  });
  return quill;
};

expect.extend({
  toEqualHTML(received, expected, options = {}) {
    const ignoreAttrs = options?.ignoreAttrs ?? [];
    const receivedDOM = document.createElement('div');
    const expectedDOM = document.createElement('div');
    receivedDOM.innerHTML = normalizeHTML(
      typeof received === 'string' ? received : received.innerHTML,
    );
    expectedDOM.innerHTML = normalizeHTML(expected);

    const doms = [receivedDOM, expectedDOM];

    for (const dom of doms) {
      for (const node of Array.from(dom.querySelectorAll('.ql-ui'))) {
        node.remove();
      }

      for (const attr of ignoreAttrs) {
        for (const node of Array.from(dom.querySelectorAll(`[${attr}]`))) {
          node.removeAttribute(attr);
        }
      }

      sortAttributes(dom);
    }

    if (this.equals(receivedDOM.innerHTML, expectedDOM.innerHTML)) {
      return { pass: true, message: () => '' };
    }
    return {
      pass: false,
      message: () =>
        `HTMLs don't match.\n${this.utils.diff(
          this.utils.stringify(receivedDOM),
          this.utils.stringify(expectedDOM),
        )}`,
    };
  },
});

interface TableColDeltaValue extends Omit<TableColValue, 'width' | 'full'> {
  width: number;
  full?: 'true';
}
interface TableCreatorOptions {
  isEmpty: boolean;
  tableId: string;
}
type ColOptions = Omit<TableColValue, 'width' | 'tableId' | 'colId'> & { width?: number };

export const datasetTableId = (id: string) => `data-table-id="${id}"`;
export const datasetFull = (full: boolean) => full ? ' data-full="true"' : '';
export const datasetAlign = (align: string) => align === 'left' ? '' : ` data-align="${align}"`;
export const getColWidthStyle = (options: Required<Omit<ColOptions, 'align' | 'tableId' | 'width'>> & { width?: number; colNum: number }) => {
  const { full, width, colNum } = options;
  let colWidth = `${width}px`;
  if (full) {
    colWidth = `${1 / colNum * 100}%`;
  }
  return `width="${colWidth}"`;
};
export const createTableDeltaOps = (row: number, col: number, colOptions?: ColOptions, options: Partial<TableCreatorOptions> = {}) => {
  const { isEmpty = false, tableId = '1' } = options;
  const { full = true, width = 100, align = 'left' } = colOptions || {};
  const table: any[] = [{ insert: '\n' }];
  for (const [i, _] of new Array(col).fill(0).entries()) {
    const value: TableColDeltaValue = { tableId, colId: `${i + 1}`, width: 1 / col * 100 };
    if (full) {
      value.full = 'true';
    }
    else {
      value.width = width;
    }
    if (align !== 'left') {
      value.align = align;
    }
    table.push({ insert: { 'table-up-col': value } });
  }
  for (let i = 0; i < row; i++) {
    for (let j = 0; j < col; j++) {
      if (!isEmpty) {
        table.push({ insert: `${i * col + j + 1}` });
      }
      table.push(
        {
          attributes: { 'table-up-cell-inner': { tableId, rowId: i + 1, colId: j + 1, rowspan: 1, colspan: 1 } },
          insert: '\n',
        },
      );
    }
  }
  table.push({ insert: '\n' });
  return table;
};
export const createTable = async (row: number, col: number, colOptions?: ColOptions, options?: Partial<TableCreatorOptions>) => {
  const quill = createQuillWithTableModule(`<p><br></p>`);
  quill.setContents(createTableDeltaOps(row, col, colOptions, options));
  // set range for undo won't scrollSelectionIntoView
  quill.setSelection({ index: 0, length: 0 });
  await vi.runAllTimersAsync();
  return quill;
};
export const createTaleColHTML = (colNum: number, colOptions?: Partial<ColOptions>, options?: Partial<TableCreatorOptions>) => {
  const { full = true, width = 100, align = 'left' } = colOptions || {};
  const { tableId = '1' } = options || {};
  const colWidth = getColWidthStyle({ full, width, colNum });
  return `
    <colgroup ${datasetTableId(tableId)}${datasetFull(full)}${datasetAlign(align)}>
      ${new Array(colNum).fill(0).map((_, i) => `<col ${colWidth} ${datasetTableId(tableId)} data-col-id="${i + 1}"${datasetFull(full)}${datasetAlign(align)} />`).join('\n')}
    </colgroup>
  `;
};
export const createTableBodyHTML = (row: number, col: number, options?: Partial<TableCreatorOptions>) => {
  const { isEmpty = false, tableId = '1' } = options || {};
  return `
    <tbody ${datasetTableId(tableId)}>
      ${
        new Array(row).fill(0).map((_, i) => `
          <tr ${datasetTableId(tableId)} data-row-id="${i + 1}">
            ${
              new Array(col).fill(0).map((_, j) => `<td rowspan="1" colspan="1" ${datasetTableId(tableId)} data-row-id="${i + 1}" data-col-id="${j + 1}">
                <div ${datasetTableId(tableId)} data-rowspan="1" data-colspan="1" data-row-id="${i + 1}" data-col-id="${j + 1}">
                  <p>
                    ${isEmpty ? '<br>' : i * row + j + 1}
                  </p>
                </div>
              </td>`).join('\n')
            }
          </tr>
        `).join('\n')
      }
    </tbody>
  `;
};
export const createTableHTML = (row: number, col: number, colOptions?: ColOptions, options?: Partial<TableCreatorOptions>) => {
  const { full = true, width = 100, align = 'left' } = colOptions || {};
  const { tableId = '1' } = options || {};
  let alignStyle = 'margin-right: auto;';
  switch (align) {
    case 'center': {
      alignStyle = 'margin-left: auto; margin-right: auto;';
      break;
    }
    case '':
    case 'left': {
      alignStyle = 'margin-right: auto;';
      break;
    }
    case 'right': {
      alignStyle = 'margin-left: auto;';
      break;
    }
    default: {
      break;
    }
  }

  return `
    <div ${datasetTableId(tableId)}>
      <table cellpadding="0" cellspacing="0" ${datasetTableId(tableId)}${datasetFull(full)}${datasetAlign(align)} style="${alignStyle}${full ? '' : ` width: ${width * col}px;`}">
        ${createTaleColHTML(col, colOptions)}
        ${createTableBodyHTML(row, col, options)}
      </table>
    </div>
  `;
};
