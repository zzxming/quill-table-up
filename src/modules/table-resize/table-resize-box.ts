import type { Parchment as TypeParchment } from 'quill';
import type { TableColFormat, TableMainFormat, TableRowFormat } from '../../formats';
import type { TableUp } from '../../table-up';
import type { sizeChangeValue } from './table-resize-common';
import Quill from 'quill';
import { TableBodyFormat, TableCaptionFormat, TableCellInnerFormat } from '../../formats';
import { addScrollEvent, clearScrollEvent, createBEM, findChildBlot } from '../../utils';
import { TableResizeCommon } from './table-resize-common';
import { isTableAlignRight } from './utils';

interface Point {
  x: number;
  y: number;
}
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
  lastHeaderSelect: { isX: boolean; index: number } | null = null;
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
    this.quill.on(Quill.events.TEXT_CHANGE, this.updateWhenTextChange);
  }

  updateWhenTextChange = () => {
    this.update();
  };

  handleResizerHeader(isX: boolean, index: number, e: MouseEvent) {
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
        // find last click head
        let lastX: number;
        let lastY: number;
        if (this.lastHeaderSelect.isX) {
          const tableRowHeads = Array.from(this.root.getElementsByClassName(this.bem.be('row-header'))) as HTMLElement[];
          const rect = tableRowHeads[this.lastHeaderSelect.index].getBoundingClientRect();
          lastX = Math.min(rect.left, tableRect.left);
          lastY = rect.top + rect.height / 2;
        }
        else {
          const tableColHeads = Array.from(this.root.getElementsByClassName(this.bem.be('col-header'))) as HTMLElement[];
          const rect = tableColHeads[this.lastHeaderSelect.index].getBoundingClientRect();
          lastX = rect.left + rect.width / 2;
          lastY = Math.min(rect.top, tableRect.top);
        }

        if (this.lastHeaderSelect.isX !== isX) {
          currentBoundary[1] = {
            x: Math.max(currentBoundary[0].x, lastX),
            y: Math.max(currentBoundary[0].y, lastY),
          };
          currentBoundary[0] = {
            x: Math.min(currentBoundary[0].x, lastX),
            y: Math.min(currentBoundary[0].y, lastY),
          };
        }
        else if (isX) {
          currentBoundary[0].y = Math.min(currentBoundary[0].y, lastY);
          currentBoundary[1].y = Math.max(currentBoundary[1].y, lastY);
        }
        else {
          currentBoundary[0].x = Math.min(currentBoundary[0].x, lastX);
          currentBoundary[1].x = Math.max(currentBoundary[1].x, lastX);
        }
      }
      else {
        this.lastHeaderSelect = { isX, index };
      }

      tableSelection.table = this.table;
      tableSelection.selectedTds = tableSelection.computeSelectedTds(...currentBoundary);
      tableSelection.show();
    }
  }

  findCurrentColIndex(e: MouseEvent): number {
    return Array.from(this.root.getElementsByClassName(this.bem.be('col-separator'))).indexOf(e.target as HTMLElement);
  }

  colWidthChange(i: number, w: sizeChangeValue, isFull: boolean) {
    const tableColHeads = Array.from(this.root.getElementsByClassName(this.bem.be('col-header'))) as HTMLElement[];
    tableColHeads[i].style.width = isFull ? `${w.pre}%` : `${w.px}px`;
  }

  handleColMouseDownFunc = function (this: TableResizeBox, e: MouseEvent) {
    const value = this.handleColMouseDown(e);
    if (value && this.dragColBreak) {
      const [tableCaptionBlot] = findChildBlot(this.tableMain, TableCaptionFormat);
      const offset = tableCaptionBlot && tableCaptionBlot.side === 'top' ? 0 : this.size;
      Object.assign(this.dragColBreak.style, {
        top: `${value.top - offset}px`,
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

    for (const [i, el] of tableColHeads.entries()) {
      el.addEventListener('click', this.handleResizerHeader.bind(this, false, i));
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

    for (const [i, el] of tableRowHeads.entries()) {
      el.addEventListener('click', this.handleResizerHeader.bind(this, true, i));
    }
    for (const el of tableRowHeadSeparators) {
      el.addEventListener('mousedown', this.handleRowMouseDownFunc);
      // prevent drag
      el.addEventListener('dragstart', e => e.preventDefault());
    }
  }

  update() {
    const [tableBodyBlot] = findChildBlot(this.tableMain, TableBodyFormat);
    if (!tableBodyBlot) return;
    const tableWrapperRect = this.tableWrapper.domNode.getBoundingClientRect();
    const tableBodyRect = tableBodyBlot.domNode.getBoundingClientRect();
    const rootRect = this.quill.root.getBoundingClientRect();
    Object.assign(this.root.style, {
      top: `${Math.max(tableBodyRect.y, tableWrapperRect.y) - rootRect.y}px`,
      left: `${Math.max(tableBodyRect.x, tableWrapperRect.x) - rootRect.x}px`,
    });

    let cornerTranslateX = -1 * this.size;
    let rowHeadWrapperTranslateX = -1 * this.size;
    if (isTableAlignRight(this.tableMain)) {
      this.root.classList.add(this.bem.is('align-right'));
      cornerTranslateX = Math.min(tableWrapperRect.width, tableBodyRect.width);
      rowHeadWrapperTranslateX = Math.min(tableWrapperRect.width, tableBodyRect.width);
    }
    else {
      this.root.classList.remove(this.bem.is('align-right'));
    }

    const [tableCaptionBlot] = findChildBlot(this.tableMain, TableCaptionFormat);
    const tableCaptionIsTop = !tableCaptionBlot || !(tableCaptionBlot && tableCaptionBlot.side === 'top');
    if (tableCaptionIsTop) {
      this.root.classList.remove(this.bem.is('caption-bottom'));
    }
    else {
      this.root.classList.add(this.bem.is('caption-bottom'));
    }

    if (this.corner) {
      Object.assign(this.corner.style, {
        transform: `translateY(${-1 * this.size}px) translateX(${cornerTranslateX}px)`,
        top: `${tableCaptionIsTop ? 0 : tableBodyRect.height + this.size}px`,
      });
    }
    if (this.rowHeadWrapper) {
      Object.assign(this.rowHeadWrapper.style, {
        transform: `translateX(${rowHeadWrapperTranslateX}px)`,
      });
    }
    if (this.colHeadWrapper) {
      Object.assign(this.colHeadWrapper.style, {
        top: `${tableCaptionIsTop ? 0 : tableBodyRect.height + this.size}px`,
      });
    }
  }

  show() {
    this.tableCols = this.tableMain.getCols();
    this.tableRows = this.tableMain.getRows();
    this.root.innerHTML = '';
    const [tableBodyBlot] = findChildBlot(this.tableMain, TableBodyFormat);
    if (!tableBodyBlot) return;
    const tableBodyRect = tableBodyBlot.domNode.getBoundingClientRect();
    const tableWrapperRect = this.tableWrapper.domNode.getBoundingClientRect();

    if (this.tableCols.length > 0 && this.tableRows.length > 0) {
      this.corner = document.createElement('div');
      this.corner.classList.add(this.bem.be('corner'));
      Object.assign(this.corner.style, {
        width: `${this.size}px`,
        height: `${this.size}px`,
      });
      this.corner.addEventListener('click', () => {
        if (this.tableModule.tableSelection) {
          const cellInners = this.tableMain.descendants(TableCellInnerFormat);
          const tableSelection = this.tableModule.tableSelection;
          tableSelection.selectedTds = cellInners;
          tableSelection.show();
          tableSelection.updateWithSelectedTds();
        }
      });
      this.root.appendChild(this.corner);
    }

    if (this.tableCols.length > 0) {
      let colHeadStr = '';
      for (const [, col] of this.tableCols.entries()) {
        const width = col.domNode.getBoundingClientRect().width;
        colHeadStr += `<div class="${this.bem.be('col-header')}" style="width: ${width}px">
          <div class="${this.bem.be('col-separator')}" style="height: ${tableBodyRect.height + this.size - 3}px"></div>
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
        width: `${tableBodyRect.width}px`,
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
      for (const [, row] of this.tableRows.entries()) {
        const height = `${row.domNode.getBoundingClientRect().height}px`;
        rowHeadStr += `<div class="${this.bem.be('row-header')}" style="height: ${Number.parseFloat(height)}px">
          <div class="${this.bem.be('row-separator')}" style="width: ${tableBodyRect.width + this.size - 3}px"></div>
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
        height: `${tableBodyRect.height}px`,
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
    this.quill.off(Quill.events.TEXT_CHANGE, this.updateWhenTextChange);
    for (const [dom, handle] of this.scrollHandler) {
      dom.removeEventListener('scroll', handle);
    }
    this.root.remove();
  }
}
