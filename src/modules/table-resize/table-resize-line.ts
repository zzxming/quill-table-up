import type TableUp from '../..';
import type { TableResizeLineOptions } from '../../utils';
import Quill from 'quill';
import { type TableCellFormat, TableRowFormat } from '../../formats';
import { blotName, findParentBlot, findParentBlots } from '../../utils';
import { TableResizeCommon } from './table-resize-common';

export class TableResizeLine extends TableResizeCommon {
  colResizer: HTMLElement;
  rowResizer: HTMLElement;
  currentTableCell?: HTMLElement;
  dragging = false;
  options: TableResizeLineOptions;

  curColIndex: number = -1;
  curRowIndex: number = -1;
  tableCellBlot?: TableCellFormat;

  constructor(public tableModule: TableUp, quill: Quill, options: Partial<TableResizeLineOptions>) {
    super(quill);
    this.options = this.resolveOptions(options);
    this.colResizer = this.tableModule.addContainer('ql-table-resize-line-col');
    this.rowResizer = this.tableModule.addContainer('ql-table-resize-line-row');

    this.quill.root.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.dragging) return;
      const tableCell = this.findTableCell(e);
      if (!tableCell) {
        return this.hideResizer();
      }
      const tableCellBlot = Quill.find(tableCell) as TableCellFormat;
      if (!tableCellBlot) return;
      if (this.currentTableCell !== tableCell) {
        this.showResizer();
        this.currentTableCell = tableCell;
        this.tableCellBlot = tableCellBlot;
        this.tableMain = findParentBlot(tableCellBlot, blotName.tableMain);
        if (this.tableMain.getCols().length > 0) {
          this.updateColResizer();
        }
        this.updateRowResizer();
      }
    });
    this.quill.on(Quill.events.TEXT_CHANGE, () => {
      this.hideResizer();
    });
  }

  resolveOptions(options: Partial<TableResizeLineOptions>) {
    return Object.assign({}, options);
  }

  findTableCell(e: MouseEvent) {
    for (const el of e.composedPath()) {
      if (el instanceof HTMLElement && el.tagName === 'TD') {
        return el;
      }
      if (el === document.body) {
        return null;
      }
    }
    return null;
  }

  findCurrentColIndex() {
    return this.curColIndex;
  }

  handleColMouseUpFunc = function (this: TableResizeLine) {
    this.handleColMouseUp();
    this.updateColResizer();
  }.bind(this);

  updateColResizer() {
    if (!this.tableMain || !this.tableCellBlot) return;
    const tableCellBlot = this.tableCellBlot;
    this.tableModule.toolBox.removeChild(this.colResizer);
    this.colResizer = this.tableModule.addContainer('ql-table-resize-line-col');

    const [tableBodyBlot] = findParentBlots(tableCellBlot, [blotName.tableBody] as const);
    const tableBodyect = tableBodyBlot.domNode.getBoundingClientRect();
    const tableCellRect = tableCellBlot.domNode.getBoundingClientRect();
    const rootRect = this.quill.root.getBoundingClientRect();
    Object.assign(this.colResizer.style, {
      top: `${tableBodyect.y - rootRect.y}px`,
      left: `${tableCellRect.right - rootRect.x}px`,
      height: `${tableBodyect.height}px`,
    });

    const cols = this.tableMain.getCols();
    this.curColIndex = cols.findIndex(col => col.colId === tableCellBlot.colId);

    this.colResizer.addEventListener('mousedown', this.handleColMouseDownFunc);
    this.colResizer.addEventListener('dragstart', (e) => {
      e.preventDefault();
    });
  }

  findCurrentRowIndex() {
    return this.curRowIndex;
  }

  handleRowMouseUpFunc = function (this: TableResizeLine) {
    this.handleRowMouseUp();
    this.updateRowResizer();
  }.bind(this);

  updateRowResizer() {
    if (!this.tableMain || !this.tableCellBlot) return;
    const tableCellBlot = this.tableCellBlot;
    this.tableModule.toolBox.removeChild(this.rowResizer);
    this.rowResizer = this.tableModule.addContainer('ql-table-resize-line-row');
    const currentRow = tableCellBlot.parent;
    if (!(currentRow instanceof TableRowFormat)) {
      return;
    }

    const [tableBodyBlot] = findParentBlots(tableCellBlot, [blotName.tableBody] as const);
    const tableBodynRect = tableBodyBlot.domNode.getBoundingClientRect();
    const tableCellRect = tableCellBlot.domNode.getBoundingClientRect();
    const rootRect = this.quill.root.getBoundingClientRect();
    Object.assign(this.rowResizer.style, {
      top: `${tableCellRect.bottom - rootRect.y}px`,
      left: `${tableBodynRect.x - rootRect.x}px`,
      width: `${tableBodynRect.width}px`,
    });

    const rows = this.tableMain.getRows();
    this.curRowIndex = rows.indexOf(currentRow);

    this.rowResizer.addEventListener('mousedown', this.handleRowMouseDownFunc);
    this.rowResizer.addEventListener('dragstart', (e) => {
      e.preventDefault();
    });
  }

  showResizer() {
    Object.assign(this.colResizer.style, { display: null });
    Object.assign(this.rowResizer.style, { display: null });
  }

  hideResizer() {
    this.currentTableCell = undefined;
    this.rowResizer.style.display = 'none';
    this.colResizer.style.display = 'none';
  }
}
