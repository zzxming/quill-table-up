import type { Parchment as TypeParchment } from 'quill';
import type { Delta as TypeDelta } from 'quill/core';
import type TypeClipboard from 'quill/modules/clipboard';
import type { TableCaptionValue, TableCellValue } from '../utils';
import Quill from 'quill';
import { TableCellFormat, TableColFormat } from '../formats';
import { blotName, cssTextToObject, isObject, isString, objectToCssText, randomId, tableUpSize } from '../utils';

const Delta = Quill.import('delta');
const Clipboard = Quill.import('modules/clipboard') as typeof TypeClipboard;
export type Selector = string | Node['TEXT_NODE'] | Node['ELEMENT_NODE'];
export type Matcher = (node: Node, delta: TypeDelta, scroll: TypeParchment.ScrollBlot) => TypeDelta;
export interface ClipboardOptions {
  matchers: [Selector, Matcher][];
}

function getCellWidth(cell: HTMLElement): number {
  let width = Number.parseFloat(cell.getAttribute('width') || String(tableUpSize.colDefaultWidth));
  if (Number.isNaN(width)) {
    const styleWidth = cell.style.width;
    width = styleWidth ? Number.parseFloat(styleWidth) : cell.offsetWidth;
  }
  return width;
}
function calculateCols(tableNode: HTMLElement, colNums: number): number[] {
  const colWidths = new Array(colNums).fill(tableUpSize.colDefaultWidth);
  // no need consider colspan
  // word table will have a row at last <!--[if !supportMisalignedColumns]-->
  // that tr doesn't have colspan and every td have width attribute. but set style "border:none"
  const rows = Array.from(tableNode.querySelectorAll('tr'));
  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll('td'));
    for (const [index, cell] of cells.entries()) {
      if (index < colNums) {
        const cellWidth = getCellWidth(cell);
        colWidths[index] = cellWidth || colWidths[index];
      }
      else {
        break;
      }
    }
  }
  return colWidths;
}

export class TableClipboard extends Clipboard {
  tableId = randomId();
  rowId = randomId();
  colIds: string[] = [];
  rowspanCount: { rowspan: number; colspan: number }[] = [];
  cellCount = 0;
  colCount = 0;
  constructor(public quill: Quill, options: Partial<ClipboardOptions>) {
    super(quill, options);
    this.addMatcher('table', this.matchTable.bind(this));
    this.addMatcher('tbody', this.matchTbody.bind(this));
    this.addMatcher('colgroup', this.matchColgroup.bind(this));
    this.addMatcher('col', this.matchCol.bind(this));
    this.addMatcher('tr', this.matchTr.bind(this));
    this.addMatcher('td', this.matchTd.bind(this));
    this.addMatcher('th', this.matchTd.bind(this));
    this.addMatcher('caption', this.matchCaption.bind(this));

    this.addMatcher(Node.ELEMENT_NODE, this.matchTdAttributor.bind(this));
  }

  matchTable(node: Node, delta: TypeDelta) {
    if (delta.ops.length === 0) return delta;

    const ops: Record<string, any>[] = [];
    const cols: Record<string, any>[] = [];
    let bodyStartIndex = -1;
    for (let i = 0; i < delta.ops.length; i++) {
      const { attributes, insert } = delta.ops[i];
      // remove quill origin table format and tableCell format
      const { table, [blotName.tableCell]: tableCell, ...attrs } = attributes || {};
      const hasCol = isObject(insert) && insert[blotName.tableCol];
      if (hasCol) {
        cols.push({ insert });
      }
      else {
        ops.push({ attributes: attrs, insert });
      }
      // record col insert index
      if (
        !attrs?.[blotName.tableCellInner]
        && !attrs?.[blotName.tableCaption]
        && !hasCol
        && isString(insert)
        && insert.trim().length > 0
      ) {
        bodyStartIndex = i;
      }
    }

    const colWidths = calculateCols(node as HTMLElement, this.colIds.length);
    const newCols = colWidths.reduce((colOps, width, i) => {
      if (!cols[i]) {
        colOps.push({
          insert: {
            [blotName.tableCol]: {
              tableId: this.tableId,
              colId: this.colIds[i],
              width,
              full: false,
            },
          },
        });
      }
      else {
        colOps.push(cols[i]);
      }
      return colOps;
    }, [] as Record<string, any>[]);
    ops.splice(bodyStartIndex + 1, 0, ...newCols);

    // reset variable to avoid conflict with other table
    this.tableId = randomId();
    this.colIds = [];
    this.rowspanCount = [];
    this.cellCount = 0;
    this.colCount = 0;
    return new Delta(ops);
  }

  matchTbody(node: Node, delta: TypeDelta) {
    const backgroundColor = (node as HTMLElement).style.backgroundColor;
    if (backgroundColor) {
      for (const op of delta.ops) {
        if (op.attributes?.[blotName.tableCellInner]) {
          const { style, ...value } = op.attributes[blotName.tableCellInner] as TableCellValue;
          const styleObj = cssTextToObject(style || '');
          if (!styleObj.backgroundColor) {
            styleObj.backgroundColor = backgroundColor;
            op.attributes[blotName.tableCellInner] = { ...value, style: objectToCssText(styleObj) };
          }
        }
      }
    }
    return delta;
  }

  matchColgroup(node: Node, delta: TypeDelta) {
    const ops: Record<string, any>[] = [];
    for (let i = 0; i < delta.ops.length; i++) {
      const op = delta.ops[i];
      if (op && isObject(op.insert) && op.insert[blotName.tableCol]) {
        ops.push(op);
      }
    }
    return new Delta(ops);
  }

  matchCol(node: Node) {
    this.colIds[this.colCount] = randomId();
    const delta = new Delta().insert({
      [blotName.tableCol]: Object.assign(
        TableColFormat.value(node as HTMLElement),
        {
          tableId: this.tableId,
          colId: this.colIds[this.colCount],
        },
      ),
    });
    this.colCount += 1;
    return delta;
  }

  matchTr(node: Node, delta: TypeDelta) {
    this.rowId = randomId();
    this.cellCount = 0;
    // minus rowspan
    for (const [i, span] of this.rowspanCount.entries()) {
      if (span.rowspan > 0) {
        span.rowspan -= 1;
      }
      if (span.rowspan <= 0) {
        this.rowspanCount[i] = { rowspan: 0, colspan: 0 };
      }
    }
    for (const op of delta.ops) {
      if (op.attributes) {
        const { background, [blotName.tableCellInner]: tableCellInner } = op.attributes;
        if (tableCellInner && background) {
          const { style = '' } = tableCellInner as TableCellValue;
          const styleObj = cssTextToObject(style);
          styleObj.backgroundColor = background as string;
          (op.attributes![blotName.tableCellInner] as TableCellValue).style = objectToCssText(styleObj);
        }
      }
    }
    return delta;
  }

  matchTd(node: Node, delta: TypeDelta) {
    const cell = node as HTMLElement;
    const cellFormat = TableCellFormat.formats(cell);
    if (!this.colIds[this.cellCount] || !this.rowspanCount[this.cellCount]) {
      for (let i = this.cellCount; i >= 0; i--) {
        if (!this.colIds[i]) {
          this.colIds[i] = randomId();
        }
        if (!this.rowspanCount[i]) {
          this.rowspanCount[i] = { rowspan: 0, colspan: 0 };
        }
      }
    }
    // skip the colspan of the cell in the previous row
    for (let i = this.cellCount; i < this.rowspanCount.length; i++) {
      const { rowspan, colspan } = this.rowspanCount[i];
      if (rowspan === 0) break;
      this.cellCount += colspan;
    }
    // add current cell rowspan in `rowspanCount` to calculate next row cell
    if (cellFormat.rowspan > 1) {
      this.rowspanCount[this.cellCount] = { rowspan: cellFormat.rowspan, colspan: cellFormat.colspan };
    }
    const colId = this.colIds[this.cellCount];
    this.cellCount += cellFormat.colspan;

    // add each insert tableCellInner format
    const value = Object.assign(
      cellFormat,
      {
        tableId: this.tableId,
        rowId: this.rowId,
        colId,
      },
    );
    // make sure <!--[if !supportMisalignedColumns]--> display border
    if (cell.style.border === 'none') {
      value.style = value.style.replaceAll(/border-(top|right|bottom|left)-style:none;?/g, '');
    }
    const ops = [];
    for (const op of delta.ops) {
      const { attributes = {}, ...other } = op;
      const { [blotName.tableCell]: tableCell, ...attrs } = attributes;
      ops.push({ ...other, attributes: { ...attrs, [blotName.tableCellInner]: value } });
    }
    if (ops.length <= 0 || !isString(ops[ops.length - 1].insert) || !(ops[ops.length - 1].insert as string).endsWith('\n')) {
      ops.push({ insert: '\n', attributes: { [blotName.tableCellInner]: value } });
    }
    return new Delta(ops);
  }

  matchTdAttributor(node: Node, delta: TypeDelta) {
    const el = node as HTMLElement;
    if (el.tagName.toLocaleLowerCase() === 'td') {
      const ops = [];
      for (const op of delta.ops) {
        const { attributes, ...other } = op;
        const tableCellInner = attributes?.[blotName.tableCellInner] as TableCellValue;
        if (attributes && tableCellInner && tableCellInner.style) {
          const { background, ...attrs } = attributes;

          const bgTemp = document.createElement('div');
          bgTemp.style.background = background as string;
          const cellTemp = document.createElement('div');
          cellTemp.style.cssText = tableCellInner.style;
          if (bgTemp.style.background === cellTemp.style.backgroundColor) {
            ops.push({ ...other, attributes: { ...attrs } });
            continue;
          }
        }

        ops.push(op);
      }
      return new Delta(ops);
    }

    return delta;
  }

  convert(
    { html, text }: { html?: string; text?: string },
    formats: Record<string, unknown> = {},
  ): TypeDelta {
    const delta = super.convert({ html, text }, formats);
    if (formats[blotName.tableCellInner]) {
      for (const op of delta.ops) {
        if (isObject(op.insert) && op.insert[blotName.tableCol]) {
          op.insert = '';
          continue;
        }
        if (!op.attributes) op.attributes = {};
        op.attributes[blotName.tableCellInner] = formats[blotName.tableCellInner];
      }
    }
    return delta;
  }

  matchCaption(node: Node, delta: TypeDelta) {
    for (let i = 0; i < delta.ops.length; i++) {
      const op = delta.ops[i];
      const { attributes } = op;
      if (attributes && attributes[blotName.tableCaption]) {
        (attributes[blotName.tableCaption] as TableCaptionValue).tableId = this.tableId;
        op.attributes = attributes;
      }
    }

    return delta;
  }
}
