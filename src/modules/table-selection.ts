import type { TableUp } from '..';
import type { TableCellInnerFormat, TableMainFormat } from '../formats';
import type { RelactiveRect, TableSelectionOptions } from '../utils';
import Quill from 'quill';
import { TableCellFormat } from '../formats';
import { addScrollEvent, clearScrollEvent } from '../utils';
import { TableMenu } from './table-menu';

const ERROR_LIMIT = 2;

export class TableSelection {
  options: TableSelectionOptions;
  boundary: RelactiveRect | null = null;
  startScrollX: number = 0;
  startScrollY: number = 0;
  selectedTableScrollX: number = 0;
  selectedTableScrollY: number = 0;
  selectedEditorScrollX = 0;
  selectedEditorScrollY = 0;
  selectedTds: TableCellInnerFormat[] = [];
  cellSelectWrap: HTMLDivElement;
  cellSelect: HTMLDivElement;
  dragging: boolean = false;
  scrollHandler: [HTMLElement, (...args: any[]) => void][] = [];
  selectingHandler = this.mouseDownHandler.bind(this);
  tableMenu: TableMenu;

  constructor(public tableModule: TableUp, public table: HTMLElement, public quill: Quill, options: Partial<TableSelectionOptions> = {}) {
    this.options = this.resolveOptions(options);

    this.cellSelectWrap = this.tableModule.addContainer('ql-table-selection');
    this.cellSelect = this.helpLinesInitial();

    const resizeObserver = new ResizeObserver(() => this.hideSelection());
    resizeObserver.observe(this.table);

    this.quill.root.addEventListener('mousedown', this.selectingHandler, false);
    this.tableMenu = new TableMenu(this.tableModule, quill, this.options.tableMenu);
  }

  resolveOptions(options: Partial<TableSelectionOptions>) {
    return Object.assign({
      selectColor: '#0589f3',
      tableMenu: {},
    }, options);
  };

  helpLinesInitial() {
    const cellSelect = document.createElement('div');
    cellSelect.classList.add('ql-table-selection_line');
    Object.assign(cellSelect.style, {
      'border-color': this.options.selectColor,
    });
    this.cellSelectWrap.appendChild(cellSelect);
    return cellSelect;
  }

  computeSelectedTds(startPoint: { x: number; y: number }, endPoint: { x: number; y: number }) {
    type TempSortedTableCellFormat = TableCellFormat & { index?: number; __rect?: DOMRect };

    // Use TableCell to calculation selected range, because TableCellInner is scrollable, the width will effect calculate
    const tableMain = Quill.find(this.table) as TableMainFormat;
    if (!tableMain) return [];
    const tableCells = new Set((tableMain.descendants(TableCellFormat) as TempSortedTableCellFormat[]).map((cell, i) => {
      cell.index = i;
      return cell;
    }));

    const { x: tableScrollX, y: tableScrollY } = this.getTableViewScroll();
    const { x: editorScrollX, y: editorScrollY } = this.getQuillViewScroll();
    this.selectedTableScrollX = tableScrollX;
    this.selectedTableScrollY = tableScrollY;
    this.selectedEditorScrollX = editorScrollX;
    this.selectedEditorScrollY = editorScrollY;

    // set boundary to initially mouse move rectangle
    const tableRect = this.table.getBoundingClientRect();
    const startPointX = startPoint.x - tableScrollX + this.startScrollX;
    const startPointY = startPoint.y - tableScrollY + this.startScrollY;
    let boundary = {
      x: Math.max(tableRect.left, Math.min(endPoint.x, startPointX)),
      y: Math.max(tableRect.top, Math.min(endPoint.y, startPointY)),
      x1: Math.min(tableRect.right, Math.max(endPoint.x, startPointX)),
      y1: Math.min(tableRect.bottom, Math.max(endPoint.y, startPointY)),
    };

    const selectedCells = new Set<TempSortedTableCellFormat>();
    let findEnd = true;
    // loop all cells to find correct boundary
    while (findEnd) {
      findEnd = false;
      for (const cell of tableCells) {
        if (!cell.__rect) {
          cell.__rect = cell.domNode.getBoundingClientRect();
        }
        // Determine whether the cell intersects with the current boundary
        const { x, y, right, bottom } = cell.__rect;
        if (isRectanglesIntersect(boundary, { x, y, x1: right, y1: bottom }, ERROR_LIMIT)) {
          // add cell to selected
          selectedCells.add(cell);
          tableCells.delete(cell);
          // update boundary
          boundary = {
            x: Math.min(boundary.x, x),
            y: Math.min(boundary.y, y),
            x1: Math.max(boundary.x1, right),
            y1: Math.max(boundary.y1, bottom),
          };
          // recalculate boundary last cells
          findEnd = true;
          break;
        }
        else if (x > boundary.x1 && y > boundary.y1) {
          break;
        }
      }
    }
    for (const cell of [...selectedCells, ...tableCells]) {
      delete cell.__rect;
    }
    // save result boundary relative to the editor
    this.boundary = getRelativeRect({
      ...boundary,
      width: boundary.x1 - boundary.x,
      height: boundary.y1 - boundary.y,
    }, this.quill.root);
    return Array.from(selectedCells).sort((a, b) => a.index! - b.index!).map((cell) => {
      delete cell.index;
      return cell.getCellInner();
    });
  }

  mouseDownHandler(mousedownEvent: MouseEvent) {
    const { button, target, clientX, clientY } = mousedownEvent;
    const closestTable = (target as HTMLElement).closest('.ql-table') as HTMLElement;
    if (button !== 0 || !closestTable) return;

    const startTableId = closestTable.dataset.tableId;
    const startPoint = { x: clientX, y: clientY };
    const { x: tableScrollX, y: tableScrollY } = this.getTableViewScroll();
    this.startScrollX = tableScrollX;
    this.startScrollY = tableScrollY;
    this.selectedTds = this.computeSelectedTds(startPoint, startPoint);
    this.showSelection();

    const mouseMoveHandler = (mousemoveEvent: MouseEvent) => {
      const { button, target, clientX, clientY } = mousemoveEvent;
      const closestTable = (target as HTMLElement).closest('.ql-table') as HTMLElement;
      if (
        button !== 0
        || !closestTable
        || closestTable.dataset.tableId !== startTableId
      ) {
        return;
      }

      this.dragging = true;
      const movePoint = { x: clientX, y: clientY };
      this.selectedTds = this.computeSelectedTds(startPoint, movePoint);
      if (this.selectedTds.length > 1) {
        this.quill.blur();
      }
      this.updateSelection();
    };
    const mouseUpHandler = () => {
      document.body.removeEventListener('mousemove', mouseMoveHandler, false);
      document.body.removeEventListener('mouseup', mouseUpHandler, false);
      this.dragging = false;
    };

    document.body.addEventListener('mousemove', mouseMoveHandler, false);
    document.body.addEventListener('mouseup', mouseUpHandler, false);
  }

  updateSelection() {
    if (this.selectedTds.length === 0 || !this.boundary) return;
    const { x: editorScrollX, y: editorScrollY } = this.getQuillViewScroll();
    const { x: tableScrollX, y: tableScrollY } = this.getTableViewScroll();
    const tableWrapperRect = this.table.parentElement!.getBoundingClientRect();
    const rootRect = this.quill.root.getBoundingClientRect();
    const wrapLeft = tableWrapperRect.x - rootRect.x;
    const wrapTop = tableWrapperRect.y - rootRect.y;

    Object.assign(this.cellSelect.style, {
      left: `${this.selectedEditorScrollX * 2 - editorScrollX + this.boundary.x + this.selectedTableScrollX - tableScrollX - wrapLeft}px`,
      top: `${this.selectedEditorScrollY * 2 - editorScrollY + this.boundary.y + this.selectedTableScrollY - tableScrollY - wrapTop}px`,
      width: `${this.boundary.width}px`,
      height: `${this.boundary.height}px`,
    });
    Object.assign(this.cellSelectWrap.style, {
      left: `${wrapLeft}px`,
      top: `${wrapTop}px`,
      width: `${tableWrapperRect.width + 2}px`,
      height: `${tableWrapperRect.height + 2}px`,
    });
    this.tableMenu.updateTools();
  }

  getQuillViewScroll() {
    return {
      x: this.quill.root.scrollLeft,
      y: this.quill.root.scrollTop,
    };
  }

  getTableViewScroll() {
    return {
      x: this.table.parentElement!.scrollLeft,
      y: this.table.parentElement!.scrollTop,
    };
  }

  showSelection() {
    clearScrollEvent.call(this);

    Object.assign(this.cellSelectWrap.style, { display: 'block' });
    this.updateSelection();

    addScrollEvent.call(this, this.quill.root, () => {
      this.updateSelection();
    });
    addScrollEvent.call(this, this.table.parentElement!, () => {
      this.updateSelection();
    });
  }

  hideSelection() {
    this.boundary = null;
    this.selectedTds = [];
    this.cellSelectWrap && Object.assign(this.cellSelectWrap.style, { display: 'none' });
    this.tableMenu.hideTools();
    clearScrollEvent.call(this);
  }

  destroy() {
    this.hideSelection();
    this.tableMenu.destroy();
    this.cellSelectWrap.remove();
    clearScrollEvent.call(this);

    this.quill.root.removeEventListener('mousedown', this.selectingHandler, false);
    return null;
  }
}

export function isRectanglesIntersect(a: Omit<RelactiveRect, 'width' | 'height'>, b: Omit<RelactiveRect, 'width' | 'height'>, tolerance = 4) {
  const { x: minAx, y: minAy, x1: maxAx, y1: maxAy } = a;
  const { x: minBx, y: minBy, x1: maxBx, y1: maxBy } = b;
  const notOverlapX = maxAx <= minBx + tolerance || minAx + tolerance >= maxBx;
  const notOverlapY = maxAy <= minBy + tolerance || minAy + tolerance >= maxBy;
  return !(notOverlapX || notOverlapY);
}

export function getRelativeRect(targetRect: Omit<RelactiveRect, 'x1' | 'y1'>, container: HTMLElement) {
  const containerRect = container.getBoundingClientRect();

  return {
    x: targetRect.x - containerRect.x - container.scrollLeft,
    y: targetRect.y - containerRect.y - container.scrollTop,
    x1: targetRect.x - containerRect.x - container.scrollLeft + targetRect.width,
    y1: targetRect.y - containerRect.y - container.scrollTop + targetRect.height,
    width: targetRect.width,
    height: targetRect.height,
  };
}
