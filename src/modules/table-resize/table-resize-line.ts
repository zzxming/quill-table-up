import type { TableUp } from '../../table-up';
import type { TableSelection } from '../table-selection';
import Quill from 'quill';
import { type TableCellFormat, TableRowFormat } from '../../formats';
import { blotName, createBEM, findParentBlot, findParentBlots } from '../../utils';
import { TableResizeCommon } from './table-resize-common';
import { isTableAlignRight } from './utils';

export class TableResizeLine extends TableResizeCommon {
  colResizer?: HTMLElement;
  rowResizer?: HTMLElement;
  currentTableCell?: HTMLElement;
  dragging = false;
  curColIndex: number = -1;
  curRowIndex: number = -1;
  tableCellBlot?: TableCellFormat;

  bem = createBEM('resize-line');
  constructor(public tableModule: TableUp, public quill: Quill, _options: any) {
    super(tableModule, quill);
    this.colResizer = this.tableModule.addContainer(this.bem.be('col'));
    this.rowResizer = this.tableModule.addContainer(this.bem.be('row'));

    this.quill.on(Quill.events.EDITOR_CHANGE, this.updateWhenTextChange);
  }

  updateWhenTextChange = (eventName: string) => {
    if (eventName === Quill.events.TEXT_CHANGE) {
      if (this.table && !this.quill.root.contains(this.table)) {
        this.setSelectionTable(undefined);
      }
      else {
        this.update();
      }
    }
  };

  mousemoveHandler = (e: MouseEvent) => {
    if (this.dragging) return;
    // when mousedown to select mutiple line. if move on resizer will get wrong selection
    const tableSelection = this.tableModule.getModules<TableSelection>('table-selection');
    if (tableSelection?.dragging) return;
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
      this.tableBlot = findParentBlot(tableCellBlot, blotName.tableMain);
      if (this.tableBlot.getCols().length > 0) {
        this.updateColResizer();
      }
      this.updateRowResizer();
    }
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
    return this.curColIndex + (this.tableCellBlot?.colspan || 1) - 1;
  }

  handleColMouseUpFunc = async function (this: TableResizeLine) {
    await this.handleColMouseUp();
    this.updateColResizer();
  }.bind(this);

  updateColResizer() {
    if (!this.tableBlot || !this.tableCellBlot || !this.colResizer) return;
    const tableCellBlot = this.tableCellBlot;
    this.colResizer.remove();
    this.colResizer = this.tableModule.addContainer(this.bem.be('col'));

    const [tableBodyBlot] = findParentBlots(tableCellBlot, [blotName.tableBody] as const);
    const tableBodyect = tableBodyBlot.domNode.getBoundingClientRect();
    const tableCellRect = tableCellBlot.domNode.getBoundingClientRect();
    const rootRect = this.quill.root.getBoundingClientRect();
    let left = tableCellRect.right - rootRect.x;
    if (isTableAlignRight(this.tableBlot)) {
      left = tableCellRect.left - rootRect.x;
    }
    Object.assign(this.colResizer.style, {
      top: `${tableBodyect.y - rootRect.y}px`,
      left: `${left}px`,
      height: `${tableBodyect.height}px`,
    });

    const cols = this.tableBlot.getCols();
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
    if (!this.tableBlot || !this.tableCellBlot || !this.rowResizer) return;
    const tableCellBlot = this.tableCellBlot;
    this.rowResizer.remove();
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

    const rows = this.tableBlot.getRows();
    this.curRowIndex = rows.indexOf(currentRow);

    this.rowResizer.addEventListener('mousedown', this.handleRowMouseDownFunc);
    this.rowResizer.addEventListener('dragstart', (e) => {
      e.preventDefault();
    });
  }

  show() {
    if (!this.table || !this.rowResizer || !this.colResizer) return;
    this.rowResizer.classList.remove(this.bem.is('hidden'));
    this.colResizer.classList.remove(this.bem.is('hidden'));
    this.table.addEventListener('mousemove', this.mousemoveHandler);
  }

  hide() {
    this.currentTableCell = undefined;
    if (!this.rowResizer || !this.colResizer) return;
    this.rowResizer.classList.add(this.bem.is('hidden'));
    this.colResizer.classList.add(this.bem.is('hidden'));
    if (!this.table) return;
    this.table.removeEventListener('mousemove', this.mousemoveHandler);
  }

  update() {
    this.updateColResizer();
    this.updateRowResizer();
  }

  destroy(): void {
    if (this.colResizer) {
      this.colResizer.remove();
      this.colResizer = undefined;
    }
    if (this.rowResizer) {
      this.rowResizer.remove();
      this.rowResizer = undefined;
    }

    this.quill.off(Quill.events.EDITOR_CHANGE, this.updateWhenTextChange);
  }
}
