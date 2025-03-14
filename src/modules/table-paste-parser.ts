import type { Parchment as TypeParchment } from 'quill';
import type { Delta as TypeDelta } from 'quill/core';
import Quill from 'quill';
import { TableCellFormat, TableColFormat } from '../formats';
import { blotName, isObject, isString, randomId, tableUpSize } from '../utils';

const Delta = Quill.import('delta');

function getCellWidth(cell: HTMLElement): number {
  let width = Number.parseFloat(cell.getAttribute('width') || tableUpSize.colDefaultWidth);
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

export class TablePasteParser {
  tableId = randomId();
  rowId = randomId();
  colIds: string[] = [];
  rowspanCount: { rowspan: number; colspan: number }[] = [];
  cellCount = 0;
  colCount = 0;
  constructor(public quill: Quill) {
    this.quill.clipboard.addMatcher('table', this.matchTable.bind(this));
    this.quill.clipboard.addMatcher('colgroup', this.matchColgroup.bind(this));
    this.quill.clipboard.addMatcher('col', this.matchCol.bind(this));
    this.quill.clipboard.addMatcher('tr', this.matchTr.bind(this));
    this.quill.clipboard.addMatcher('td', this.matchTd.bind(this));
    this.quill.clipboard.addMatcher('th', this.matchTd.bind(this));

    this.quill.clipboard.addMatcher(Node.TEXT_NODE, this.matchEveryNode.bind(this));
    this.quill.clipboard.addMatcher(Node.ELEMENT_NODE, this.matchEveryNode.bind(this));
  }

  // handle paste html or text into table cell
  matchEveryNode(node: Node, delta: TypeDelta, _scroll: TypeParchment.ScrollBlot) {
    const range = this.quill.getSelection(true);
    const formats = this.quill.getFormat(range);
    const tableCellInnerValue = formats[blotName.tableCellInner];
    if (tableCellInnerValue) {
      for (const op of delta.ops) {
        if (!op.attributes) op.attributes = {};
        op.attributes[blotName.tableCellInner] = tableCellInnerValue;
      }
    }
    return delta;
  }

  matchTable(node: Node, delta: TypeDelta) {
    if (delta.ops.length === 0) return delta;

    const format = this.quill.getFormat();
    const currentCellFormat = format[blotName.tableCellInner];
    const ops: Record<string, any>[] = [];
    const cols: Record<string, any>[] = [];
    for (let i = 0; i < delta.ops.length; i++) {
      const { attributes, insert } = delta.ops[i];
      // remove quill origin table format and tableCell format
      const { table, [blotName.tableCell]: tableCell, ...attrs } = attributes || {};
      const hasCol = insert && (insert as Record<string, any>)[blotName.tableCol];
      if (currentCellFormat) {
        // if current in cell. no need add col. but need replace paste cell format with current cell format
        if (hasCol) continue;
        const { [blotName.tableCellInner]: tableCellInner, ...keepAtttrs } = attrs;
        ops.push({
          attributes: {
            ...keepAtttrs,
            [blotName.tableCellInner]: currentCellFormat,
          },
          insert,
        });
      }
      else {
        if (hasCol) {
          cols.push({ insert });
        }
        else {
          ops.push({ attributes: attrs, insert });
        }
      }
    }

    // if current in cell. no need add col
    if (!currentCellFormat) {
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
      ops.unshift(...newCols);
    }
    // reset variable to avoid conflict with other table
    this.tableId = randomId();
    this.colIds = [];
    this.rowspanCount = [];
    this.cellCount = 0;
    this.colCount = 0;
    return new Delta(ops);
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
    for (const op of delta.ops) {
      if (
        op.attributes && op.attributes.background
        && op.attributes[blotName.tableCellInner]
      ) {
        const cellAttrs = op.attributes[blotName.tableCellInner] as Record<string, any>;
        if (!cellAttrs.style) cellAttrs.style = '';
        (op.attributes[blotName.tableCellInner] as Record<string, any>).style = `background:${op.attributes.background};${cellAttrs.style}`;
      }
    }
    // minus rowspan
    for (const [i, span] of this.rowspanCount.entries()) {
      if (span.rowspan > 0) {
        span.rowspan -= 1;
      }
      if (span.rowspan <= 0) {
        this.rowspanCount[i] = { rowspan: 0, colspan: 0 };
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
    const { colspan } = this.rowspanCount[this.cellCount];
    this.cellCount += colspan;
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
    function isOnlyNewlines(input: string) {
      for (const char of input) {
        if (char !== '\n') {
          return false;
        }
      }
      return true;
    }
    const ops = [];
    for (const op of delta.ops) {
      const { insert, attributes } = op;
      if (insert) {
        const { [blotName.tableCell]: tableCell, ...attrs } = attributes as Record<string, unknown>;
        // background will effect on `td`. but we alreadt handle backgroundColor in tableCell. need delete it
        if (isString(insert) && isOnlyNewlines(insert)) {
          delete attrs.background;
        }
        ops.push({ insert, attributes: { ...attrs, [blotName.tableCellInner]: value } });
      }
    }
    return new Delta(ops);
  }
}
