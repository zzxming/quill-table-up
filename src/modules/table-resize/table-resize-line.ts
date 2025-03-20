import type { TableUp } from '../../table-up';
import Quill from 'quill';
import { type TableCellFormat, TableRowFormat } from '../../formats';
import { blotName, createBEM, findParentBlot, findParentBlots } from '../../utils';
import { TableResizeCommon } from './table-resize-common';
import { isTableAlignRight } from './utils';

export class TableResizeLine extends TableResizeCommon {
  colResizer: HTMLElement;
  rowResizer: HTMLElement;
  currentTableCell?: HTMLElement;
  dragging = false;

  curColIndex: number = -1;
  curRowIndex: number = -1;
  tableCellBlot?: TableCellFormat;

  bem = createBEM('resize-line');
  constructor(public tableModule: TableUp, public table: HTMLElement, quill: Quill) {
    super(tableModule, quill);
    this.colResizer = this.tableModule.addContainer(this.bem.be('col'));
    this.rowResizer = this.tableModule.addContainer(this.bem.be('row'));

    this.table.addEventListener('mousemove', this.mousemoveHandler);
    this.quill.on(Quill.events.TEXT_CHANGE, this.hideWhenTextChange);
  }

  mousemoveHandler = (e: MouseEvent) => {
    if (this.dragging) return;
    // when mousedown to select mutiple line. if move on resizer will get wrong selection
    if (this.tableModule.tableSelection && this.tableModule.tableSelection.dragging) return;
    const tableCell = this.findTableCell(e);
    if (!tableCell) {
      return this.hide();
    }
    const tableCellBlot = Quill.find(tableCell) as TableCellFormat;
    if (!tableCellBlot) return;
    if (this.currentTableCell !== tableCell) {
      this.show();
      this.currentTableCell = tableCell;
      this.tableCellBlot = tableCellBlot;
      this.tableMain = findParentBlot(tableCellBlot, blotName.tableMain);
      if (this.tableMain.getCols().length > 0) {
        this.updateColResizer();
      }
      this.updateRowResizer();
    }
  };

  hideWhenTextChange = () => {
    this.hide();
  };

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

  handleColMouseUpFunc = async function (this: TableResizeLine) {
    await this.handleColMouseUp();
    this.updateColResizer();
  }.bind(this);

  updateColResizer() {
    if (!this.tableMain || !this.tableCellBlot) return;
    const tableCellBlot = this.tableCellBlot;
    this.tableModule.toolBox.removeChild(this.colResizer);
    this.colResizer = this.tableModule.addContainer(this.bem.be('col'));

    const [tableBodyBlot] = findParentBlots(tableCellBlot, [blotName.tableBody] as const);
    const tableBodyect = tableBodyBlot.domNode.getBoundingClientRect();
    const tableCellRect = tableCellBlot.domNode.getBoundingClientRect();
    const rootRect = this.quill.root.getBoundingClientRect();
    let left = tableCellRect.right - rootRect.x;
    if (isTableAlignRight(this.tableMain)) {
      left = tableCellRect.left - rootRect.x;
    }
    Object.assign(this.colResizer.style, {
      top: `${tableBodyect.y - rootRect.y}px`,
      left: `${left}px`,
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
    this.rowResizer = this.tableModule.addContainer(this.bem.be('row'));
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

  show() {
    this.rowResizer.classList.remove(this.bem.is('hidden'));
    this.colResizer.classList.remove(this.bem.is('hidden'));
  }

  hide() {
    this.currentTableCell = undefined;
    this.rowResizer.classList.add(this.bem.is('hidden'));
    this.colResizer.classList.add(this.bem.is('hidden'));
  }

  update() {
    this.updateColResizer();
    this.updateRowResizer();
  }

  destroy(): void {
    this.colResizer.remove();
    this.rowResizer.remove();

    this.table.removeEventListener('mousemove', this.mousemoveHandler);
    this.quill.off(Quill.events.TEXT_CHANGE, this.hideWhenTextChange);
  }
}
