import type { TableColFormat, TableMainFormat, TableRowFormat, TableWrapperFormat } from '../../formats';
import type { TableUp } from '../../table-up';
import type { TableSelection } from '../table-selection';
import type { sizeChangeValue } from './table-resize-common';
import Quill from 'quill';
import { getTableMainRect, TableCaptionFormat, TableCellInnerFormat } from '../../formats';
import { addScrollEvent, clearScrollEvent, createBEM, createResizeObserver, findChildBlot } from '../../utils';
import { TableResizeCommon } from './table-resize-common';
import { isTableAlignRight } from './utils';

interface Point {
  x: number;
  y: number;
}
export class TableResizeBox extends TableResizeCommon {
  root: HTMLElement;
  tableWrapperBlot?: TableWrapperFormat;
  resizeObserver?: ResizeObserver;
  tableCols: TableColFormat[] = [];
  tableRows: TableRowFormat[] = [];
  rowHeadWrapper: HTMLElement | null = null;
  colHeadWrapper: HTMLElement | null = null;
  corner: HTMLElement | null = null;
  scrollHandler: [HTMLElement, (e: Event) => void][] = [];
  lastHeaderSelect: { isX: boolean; index: number } | null = null;
  size: number = 12;
  bem = createBEM('resize-box');

  constructor(public tableModule: TableUp, public quill: Quill, _options: any) {
    super(tableModule, quill);

    this.root = this.tableModule.addContainer(this.bem.b());
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

  setSelectionTable(table: HTMLTableElement | undefined) {
    if (this.table === table) return;
    this.hide();
    this.table = table;
    if (this.table) {
      const newTableBlot = Quill.find(this.table) as TableMainFormat;
      if (newTableBlot) {
        this.tableBlot = newTableBlot;
        this.tableWrapperBlot = this.tableBlot.parent as TableWrapperFormat;
      }
      this.show();
    }
    this.update();
  }

  handleResizerHeader(isX: boolean, index: number, e: MouseEvent) {
    if (!this.table) return;
    const { clientX, clientY } = e;
    const tableRect = this.table.getBoundingClientRect();
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

    const tableSelection = this.tableModule.getModule<TableSelection>('table-selection');
    if (tableSelection) {
      tableSelection.table = this.table;
      tableSelection.setSelectedTds(tableSelection.computeSelectedTds(...currentBoundary));
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
    if (value && this.dragColBreak && this.tableBlot) {
      const [tableCaptionBlot] = findChildBlot(this.tableBlot, TableCaptionFormat);
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

    addScrollEvent.call(this, this.tableWrapperBlot!.domNode, () => {
      this.colHeadWrapper!.scrollLeft = this.tableWrapperBlot!.domNode.scrollLeft;
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

    addScrollEvent.call(this, this.tableWrapperBlot!.domNode, () => {
      this.rowHeadWrapper!.scrollTop = this.tableWrapperBlot!.domNode.scrollTop;
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
    if (!this.tableBlot || !this.tableWrapperBlot) return;
    const { rect: tableRect, body: tableBodyBlot } = getTableMainRect(this.tableBlot);
    if (!tableBodyBlot || !tableRect) return;

    this.root.innerHTML = '';

    this.tableCols = this.tableBlot.getCols();
    this.tableRows = this.tableBlot.getRows();
    const tableWrapperRect = this.tableWrapperBlot.domNode.getBoundingClientRect();
    const rootRect = this.quill.root.getBoundingClientRect();
    Object.assign(this.root.style, {
      top: `${Math.max(tableRect.y, tableWrapperRect.y) - rootRect.y}px`,
      left: `${Math.max(tableRect.x, tableWrapperRect.x) - rootRect.x}px`,
    });

    if (this.tableCols.length > 0 && this.tableRows.length > 0) {
      this.corner = document.createElement('div');
      this.corner.classList.add(this.bem.be('corner'));
      Object.assign(this.corner.style, {
        width: `${this.size}px`,
        height: `${this.size}px`,
      });
      this.corner.addEventListener('click', () => {
        const tableSelection = this.tableModule.getModule<TableSelection>('table-selection');
        if (tableSelection && this.tableBlot) {
          tableSelection.setSelectedTds(this.tableBlot.descendants(TableCellInnerFormat));
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
          <div class="${this.bem.be('col-separator')}" style="height: ${tableRect.height + this.size - 3}px"></div>
        </div>`;
      }
      const colHeadWrapper = document.createElement('div');
      colHeadWrapper.classList.add(this.bem.be('col'));
      Object.assign(colHeadWrapper.style, {
        transform: `translateY(-${this.size}px)`,
        maxWidth: `${tableWrapperRect.width}px`,
        height: `${this.size}px`,
      });
      colHeadWrapper.innerHTML = colHeadStr;
      this.root.appendChild(colHeadWrapper);
      colHeadWrapper.scrollLeft = this.tableWrapperBlot.domNode.scrollLeft;
      this.colHeadWrapper = colHeadWrapper;
      this.bindColEvents();
    }

    if (this.tableRows.length > 0) {
      let rowHeadStr = '';
      for (const [, row] of this.tableRows.entries()) {
        const height = `${row.domNode.getBoundingClientRect().height}px`;
        rowHeadStr += `<div class="${this.bem.be('row-header')}" style="height: ${Number.parseFloat(height)}px">
          <div class="${this.bem.be('row-separator')}" style="width: ${tableRect.width + this.size - 3}px"></div>
        </div>`;
      }
      const rowHeadWrapper = document.createElement('div');
      rowHeadWrapper.classList.add(this.bem.be('row'));
      Object.assign(rowHeadWrapper.style, {
        transform: `translateX(-${this.size}px)`,
        width: `${this.size}px`,
        maxHeight: `${tableWrapperRect.height}px`,
      });
      rowHeadWrapper.innerHTML = rowHeadStr;
      this.root.appendChild(rowHeadWrapper);
      rowHeadWrapper.scrollTop = this.tableWrapperBlot.domNode.scrollTop;
      this.rowHeadWrapper = rowHeadWrapper;
      this.bindRowEvents();
    }

    // computed about `caption`
    const [tableCaptionBlot] = findChildBlot(this.tableBlot, TableCaptionFormat);
    const tableCaptionIsTop = !tableCaptionBlot || !(tableCaptionBlot && tableCaptionBlot.side === 'top');
    if (tableCaptionIsTop) {
      this.root.classList.remove(this.bem.is('caption-bottom'));
    }
    else {
      this.root.classList.add(this.bem.is('caption-bottom'));
    }
    let cornerTranslateX = -1 * this.size;
    let rowHeadWrapperTranslateX = -1 * this.size;
    if (isTableAlignRight(this.tableBlot)) {
      this.root.classList.add(this.bem.is('align-right'));
      cornerTranslateX = Math.min(tableWrapperRect.width, tableRect.width);
      rowHeadWrapperTranslateX = Math.min(tableWrapperRect.width, tableRect.width);
    }
    else {
      this.root.classList.remove(this.bem.is('align-right'));
    }
    if (this.corner) {
      Object.assign(this.corner.style, {
        transform: `translateY(${-1 * this.size}px) translateX(${cornerTranslateX}px)`,
        top: `${tableCaptionIsTop ? 0 : tableRect.height + this.size}px`,
      });
    }
    if (this.rowHeadWrapper) {
      Object.assign(this.rowHeadWrapper.style, {
        transform: `translateX(${rowHeadWrapperTranslateX}px)`,
        maxHeight: `${tableWrapperRect.height}px`,
      });
    }
    if (this.colHeadWrapper) {
      Object.assign(this.colHeadWrapper.style, {
        top: `${tableCaptionIsTop ? 0 : tableRect.height + this.size}px`,
        maxWidth: `${tableWrapperRect.width}px`,
      });
    }
  }

  show() {
    if (!this.table || !this.tableBlot || !this.tableWrapperBlot) return;

    this.root.classList.remove(this.bem.is('hidden'));
    this.resizeObserver = createResizeObserver(() => this.update(), { ignoreFirstBind: true });
    this.resizeObserver.observe(this.table);

    this.update();
    addScrollEvent.call(this, this.quill.root, () => {
      this.update();
    });
  }

  hide() {
    this.root.classList.add(this.bem.is('hidden'));
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
  }

  destroy() {
    this.hide();
    clearScrollEvent.call(this);
    this.quill.off(Quill.events.EDITOR_CHANGE, this.updateWhenTextChange);
    for (const [dom, handle] of this.scrollHandler) {
      dom.removeEventListener('scroll', handle);
    }
    this.root.remove();
  }
}
