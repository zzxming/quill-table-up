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
  selectedTds: TableCellInnerFormat[] = [];
  cellSelect: HTMLDivElement;
  dragging: boolean = false;
  scrollHandler: [HTMLElement, (...args: any[]) => void][] = [];
  selectingHandler = this.mouseDownHandler.bind(this);
  tableMenu: TableMenu;

  constructor(public tableModule: TableUp, public table: HTMLElement, public quill: Quill, options: Partial<TableSelectionOptions> = {}) {
    this.options = this.resolveOptions(options);

    this.cellSelect = this.tableModule.addContainer('ql-table-selection_line');
    this.helpLinesInitial();

    const resizeObserver = new ResizeObserver(() => {
      this.hideSelection();
    });
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
    Object.assign(this.cellSelect.style, {
      'border-color': this.options.selectColor,
    });
  }

  computeSelectedTds(startPoint: { x: number; y: number }, endPoint: { x: number; y: number }) {
    type TempSortedTableCellFormat = TableCellFormat & { index?: number };

    // Use TableCell to calculation selected range, because TableCellInner is scrollable, the width will effect calculate
    const tableMain = Quill.find(this.table) as TableMainFormat;
    if (!tableMain) return [];
    const tableCells = new Set((tableMain.descendants(TableCellFormat) as TempSortedTableCellFormat[]).map((cell, i) => {
      cell.index = i;
      return cell;
    }));

    const tableRect = this.table.getBoundingClientRect();
    // set boundary to initially mouse move rectangle
    let boundary = {
      x: Math.max(tableRect.left, Math.min(endPoint.x, startPoint.x)),
      y: Math.max(tableRect.top, Math.min(endPoint.y, startPoint.y)),
      x1: Math.min(tableRect.right, Math.max(endPoint.x, startPoint.x)),
      y1: Math.min(tableRect.bottom, Math.max(endPoint.y, startPoint.y)),
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
    }, this.quill.root.parentNode as HTMLElement);
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
    this.startScrollX = (this.table.parentNode as HTMLElement).scrollLeft;
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
    const tableViewScrollLeft = (this.table.parentNode as HTMLElement).scrollLeft;
    const scrollTop = (this.quill.root.parentNode as HTMLElement).scrollTop;

    Object.assign(this.cellSelect.style, {
      left: `${this.boundary.x + (this.startScrollX - tableViewScrollLeft) - 1}px`,
      top: `${scrollTop * 2 + this.boundary.y}px`,
      width: `${this.boundary.width + 1}px`,
      height: `${this.boundary.height + 1}px`,
    });
    this.tableMenu.updateTools();
  }

  showSelection() {
    clearScrollEvent.call(this);

    Object.assign(this.cellSelect.style, { display: 'block' });
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
    this.cellSelect && Object.assign(this.cellSelect.style, { display: 'none' });
    this.tableMenu.hideTools();
    clearScrollEvent.call(this);
  }

  destroy() {
    this.hideSelection();
    this.tableMenu.destroy();
    this.cellSelect.remove();
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
