import type { Parchment as TypeParchment } from 'quill';
import type TableUp from '../..';
import type { TableColFormat, TableMainFormat, TableRowFormat } from '../..';
import Quill from 'quill';
import { addScrollEvent, clearScrollEvent, createBEM } from '../../utils';
import { TableResizeCommon } from './table-resize-common';
import { isTableAlignRight } from './utils';

interface Point {
  x: number;
  y: number;
};
export class TableResizeBox extends TableResizeCommon {
  root!: HTMLElement;
  tableMain: TableMainFormat;
  tableWrapper!: TypeParchment.Parent;
  resizeObserver!: ResizeObserver;
  tableCols: TableColFormat[] = [];
  tableRows: TableRowFormat[] = [];
  rowHeadWrapper: HTMLElement | null = null;
  colHeadWrapper: HTMLElement | null = null;
  corner: HTMLElement | null = null;
  scrollHandler: [HTMLElement, (e: Event) => void][] = [];
  lastHeaderSelect: [Point, Point] | null = null;
  size: number = 12;
  bem = createBEM('resize-box');

  constructor(public tableModule: TableUp, public table: HTMLElement, quill: Quill) {
    super(tableModule, quill);
    this.tableMain = Quill.find(this.table) as TableMainFormat;

    if (!this.tableMain) return;
    this.tableWrapper = this.tableMain.parent;
    if (!this.tableWrapper) return;

    this.root = this.tableModule.addContainer(this.bem.b());
    this.resizeObserver = new ResizeObserver(() => {
      this.show();
    });
    this.resizeObserver.observe(this.table);
  }

  handleResizerHeader(isX: boolean, e: MouseEvent) {
    const { clientX, clientY } = e;
    const tableRect = this.table.getBoundingClientRect();
    if (this.tableModule.tableSelection) {
      const tableSelection = this.tableModule.tableSelection;
      if (!e.shiftKey) {
        this.lastHeaderSelect = null;
      }
      const currentBoundary: [Point, Point] = [
        { x: isX ? tableRect.left : clientX, y: isX ? clientY : tableRect.top },
        { x: isX ? tableRect.right : clientX, y: isX ? clientY : tableRect.bottom },
      ];
      if (this.lastHeaderSelect) {
        currentBoundary[0] = {
          x: Math.min(currentBoundary[0].x, this.lastHeaderSelect[0].x),
          y: Math.min(currentBoundary[0].y, this.lastHeaderSelect[0].y),
        };
        currentBoundary[1] = {
          x: Math.max(currentBoundary[1].x, this.lastHeaderSelect[1].x),
          y: Math.max(currentBoundary[1].y, this.lastHeaderSelect[1].y),
        };
      }
      else {
        this.lastHeaderSelect = currentBoundary;
      }

      tableSelection.selectedTds = tableSelection.computeSelectedTds(...currentBoundary);
      tableSelection.show();
    }
  };

  findCurrentColIndex(e: MouseEvent): number {
    return Array.from(this.root.getElementsByClassName(this.bem.be('col-separator'))).indexOf(e.target as HTMLElement);
  }

  colWidthChange(i: number, w: number, _isFull: boolean) {
    const tableColHeads = Array.from(this.root.getElementsByClassName(this.bem.be('col-header'))) as HTMLElement[];
    tableColHeads[i].style.width = `${w}px`;
  }

  handleColMouseDownFunc = function (this: TableResizeBox, e: MouseEvent) {
    const value = this.handleColMouseDown(e);
    if (value && this.dragColBreak) {
      Object.assign(this.dragColBreak.style, {
        top: `${value.top - this.size}px`,
        left: `${value.left}px`,
        height: `${value.height + this.size}px`,
      });
    }
    return value;
  }.bind(this);

  bindColEvents() {
    const tableColHeads = Array.from(this.root.getElementsByClassName(this.bem.be('col-header'))) as HTMLElement[];
    const tableColHeadSeparators = Array.from(this.root.getElementsByClassName(this.bem.be('col-separator'))) as HTMLElement[];

    addScrollEvent.call(this, this.tableWrapper.domNode, () => {
      this.colHeadWrapper!.scrollLeft = this.tableWrapper.domNode.scrollLeft;
    });

    for (const el of tableColHeads) {
      el.addEventListener('click', this.handleResizerHeader.bind(this, false));
    }
    for (const el of tableColHeadSeparators) {
      el.addEventListener('mousedown', this.handleColMouseDownFunc);
      // prevent drag
      el.addEventListener('dragstart', e => e.preventDefault());
    }
  }

  findCurrentRowIndex(e: MouseEvent): number {
    return Array.from(this.root.getElementsByClassName(this.bem.be('row-separator'))).indexOf(e.target as HTMLElement);
  }

  rowHeightChange(i: number, h: number) {
    const tableRowHeads = Array.from(this.root.getElementsByClassName(this.bem.be('row-header'))) as HTMLElement[];
    tableRowHeads[i].style.height = `${h}px`;
  }

  handleRowMouseDownFunc = function (this: TableResizeBox, e: MouseEvent) {
    const value = this.handleRowMouseDown(e);
    if (value && this.dragRowBreak) {
      Object.assign(this.dragRowBreak.style, {
        top: `${value.top}px`,
        left: `${value.left - this.size}px`,
        width: `${value.width + this.size}px`,
      });
    }
    return value;
  }.bind(this);

  bindRowEvents() {
    const tableRowHeads = Array.from(this.root.getElementsByClassName(this.bem.be('row-header'))) as HTMLElement[];
    const tableRowHeadSeparators = Array.from(this.root.getElementsByClassName(this.bem.be('row-separator'))) as HTMLElement[];

    addScrollEvent.call(this, this.tableWrapper.domNode, () => {
      this.rowHeadWrapper!.scrollTop = this.tableWrapper.domNode.scrollTop;
    });

    for (const el of tableRowHeads) {
      el.addEventListener('click', this.handleResizerHeader.bind(this, true));
    }
    for (const el of tableRowHeadSeparators) {
      el.addEventListener('mousedown', this.handleRowMouseDownFunc);
      // prevent drag
      el.addEventListener('dragstart', e => e.preventDefault());
    }
  }

  update() {
    const tableMainRect = this.tableMain.domNode.getBoundingClientRect();
    const tableWrapperRect = this.tableWrapper.domNode.getBoundingClientRect();
    const tableNodeX = Math.max(tableMainRect.x, tableWrapperRect.x);
    const tableNodeY = Math.max(tableMainRect.y, tableWrapperRect.y);
    const rootRect = this.quill.root.getBoundingClientRect();
    Object.assign(this.root.style, {
      top: `${tableNodeY - rootRect.y}px`,
      left: `${tableNodeX - rootRect.x}px`,
    });

    let cornerTranslateX = -1 * this.size;
    let rowHeadWrapperTranslateX = -1 * this.size;
    if (isTableAlignRight(this.tableMain)) {
      this.root.classList.add(this.bem.is('align-right'));
      cornerTranslateX = Math.min(tableWrapperRect.width, tableMainRect.width);
      rowHeadWrapperTranslateX = Math.min(tableWrapperRect.width, tableMainRect.width);
    }
    else {
      this.root.classList.remove(this.bem.is('align-right'));
    }

    if (this.corner) {
      Object.assign(this.corner.style, {
        transform: `translateY(${-1 * this.size}px) translateX(${cornerTranslateX}px)`,
      });
    }
    if (this.rowHeadWrapper) {
      Object.assign(this.rowHeadWrapper.style, {
        transform: `translateX(${rowHeadWrapperTranslateX}px)`,
      });
    }
  }

  show() {
    this.tableCols = this.tableMain.getCols();
    this.tableRows = this.tableMain.getRows();
    this.root.innerHTML = '';
    const tableWrapperRect = this.tableWrapper.domNode.getBoundingClientRect();
    const tableMainRect = this.tableMain.domNode.getBoundingClientRect();

    if (this.tableCols.length > 0 && this.tableRows.length > 0) {
      this.corner = document.createElement('div');
      this.corner.classList.add(this.bem.be('corner'));
      Object.assign(this.corner.style, {
        width: `${this.size}px`,
        height: `${this.size}px`,
      });
      this.corner.addEventListener('click', () => {
        const tableRect = this.table.getBoundingClientRect();
        if (this.tableModule.tableSelection) {
          const tableSelection = this.tableModule.tableSelection;
          tableSelection.selectedTds = tableSelection.computeSelectedTds(
            { x: tableRect.x, y: tableRect.y },
            { x: tableRect.right, y: tableRect.bottom },
          );
          tableSelection.show();
        }
      });
      this.root.appendChild(this.corner);
    }

    if (this.tableCols.length > 0) {
      let colHeadStr = '';
      for (const [index, col] of this.tableCols.entries()) {
        const width = col.domNode.getBoundingClientRect().width;
        colHeadStr += `<div class="${this.bem.be('col-header')}" style="width: ${width + (index === this.tableCols.length - 1 ? 1 : 0)}px">
          <div class="${this.bem.be('col-separator')}" style="height: ${tableMainRect.height + this.size - 3}px"></div>
        </div>`;
      }
      const colHeadWrapper = document.createElement('div');
      colHeadWrapper.classList.add(this.bem.be('col'));
      const colHead = document.createElement('div');
      colHead.classList.add(this.bem.be('col-wrapper'));
      Object.assign(colHeadWrapper.style, {
        transform: `translateY(-${this.size}px)`,
        maxWidth: `${tableWrapperRect.width}px`,
        height: `${this.size}px`,
      });
      Object.assign(colHead.style, {
        width: `${tableMainRect.width}px`,
      });
      colHead.innerHTML = colHeadStr;
      colHeadWrapper.appendChild(colHead);
      this.root.appendChild(colHeadWrapper);
      colHeadWrapper.scrollLeft = this.tableWrapper.domNode.scrollLeft;
      this.colHeadWrapper = colHeadWrapper;
      this.bindColEvents();
    }

    if (this.tableRows.length > 0) {
      let rowHeadStr = '';
      for (const [index, row] of this.tableRows.entries()) {
        const height = `${row.domNode.getBoundingClientRect().height}px`;
        rowHeadStr += `<div class="${this.bem.be('row-header')}" style="height: ${Number.parseFloat(height) + (index === this.tableRows.length - 1 ? 1 : 0)}px">
          <div class="${this.bem.be('row-separator')}" style="width: ${tableMainRect.width + this.size - 3}px"></div>
        </div>`;
      }
      const rowHeadWrapper = document.createElement('div');
      rowHeadWrapper.classList.add(this.bem.be('row'));
      const rowHead = document.createElement('div');
      rowHead.classList.add(this.bem.be('row-wrapper'));

      Object.assign(rowHeadWrapper.style, {
        transform: `translateX(-${this.size}px)`,
        width: `${this.size}px`,
        maxHeight: `${tableWrapperRect.height}px`,
      });
      Object.assign(rowHead.style, {
        height: `${tableMainRect.height}px`,
      });
      rowHead.innerHTML = rowHeadStr;
      rowHeadWrapper.appendChild(rowHead);
      this.root.appendChild(rowHeadWrapper);
      rowHeadWrapper.scrollTop = this.tableWrapper.domNode.scrollTop;
      this.rowHeadWrapper = rowHeadWrapper;
      this.bindRowEvents();
    }

    this.update();
    addScrollEvent.call(this, this.quill.root, () => {
      this.update();
    });
  }

  hide() {
    this.root.classList.add(this.bem.is('hidden'));
  }

  destroy() {
    this.hide();
    clearScrollEvent.call(this);
    this.resizeObserver.disconnect();
    for (const [dom, handle] of this.scrollHandler) {
      dom.removeEventListener('scroll', handle);
    }
    this.root.remove();
  }
}
