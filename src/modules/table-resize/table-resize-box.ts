import type { TableMainFormat, TableWrapperFormat } from '../../formats';
import type { TableUp } from '../../table-up';
import type { TableSelection } from '../table-selection';
import Quill from 'quill';
import { getTableMainRect, TableCaptionFormat, TableCellInnerFormat } from '../../formats';
import { addScrollEvent, clearScrollEvent, createBEM, createResizeObserver, dragElement, findChildBlot } from '../../utils';
import { TableResizeCommon } from './table-resize-common';
import { isTableAlignRight } from './utils';

export class TableResizeBox extends TableResizeCommon {
  root: HTMLElement;
  tableWrapperBlot?: TableWrapperFormat;
  resizeObserver?: ResizeObserver;
  rowHeadWrapper: HTMLElement | null = null;
  colHeadWrapper: HTMLElement | null = null;
  corner: HTMLElement | null = null;
  scrollHandler: [HTMLElement, (e: Event) => void][] = [];
  lastHeaderSelect: { isX: boolean; index: number } | null = null;
  size: number = 12;
  bem = createBEM('resize-box');
  draggingColIndex = -1;
  draggingRowIndex = -1;
  stopColDrag: (() => void)[] = [];
  stopRowDrag: (() => void)[] = [];

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

  handleResizerHeaderClick(isX: boolean, index: number, e: MouseEvent) {
    if (!this.table) return;
    interface Position {
      x: number;
      y: number;
    }
    const { clientX, clientY } = e;
    const tableRect = this.table.getBoundingClientRect();
    if (!e.shiftKey) {
      this.lastHeaderSelect = null;
    }
    const currentBoundary: [Position, Position] = [
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

  findDragColIndex() {
    return this.draggingColIndex;
  }

  bindColEvents() {
    const tableColHeads = Array.from(this.root.getElementsByClassName(this.bem.be('col-header'))) as HTMLElement[];
    const tableColHeadSeparators = Array.from(this.root.getElementsByClassName(this.bem.be('col-separator'))) as HTMLElement[];

    addScrollEvent.call(this, this.tableWrapperBlot!.domNode, () => {
      this.colHeadWrapper!.scrollLeft = this.tableWrapperBlot!.domNode.scrollLeft;
    });

    for (const [i, el] of tableColHeads.entries()) {
      el.addEventListener('click', this.handleResizerHeaderClick.bind(this, false, i));
    }

    if (this.stopColDrag.length > 0) {
      for (const stop of this.stopColDrag) stop();
      this.stopColDrag = [];
    }
    for (const [i, el] of tableColHeadSeparators.entries()) {
      const { stop } = dragElement(el, {
        axis: 'x',
        onStart: (position, e) => {
          this.dragging = true;

          this.draggingColIndex = i;
          this.calculateColDragRange();
          this.createColBreak();
          if (!this.tableBlot) return;
          const tableWrapperRect = this.tableBlot.domNode.parentElement!.getBoundingClientRect();
          const { rect: tableRect } = getTableMainRect(this.tableBlot);
          if (!tableRect) return;
          // record current tablb rect to calculate the offset if have scroll when dragging
          this.startX = tableRect.x;
          const rootRect = this.quill.root.getBoundingClientRect();
          Object.assign(this.dragColBreak!.style, {
            top: `${Math.max(tableWrapperRect.y, tableRect.y) - rootRect.y}px`,
            left: `${e.clientX - rootRect.x}px`,
            height: `${Math.min(tableWrapperRect.height, tableRect.height)}px`,
          });
        },
        onMove: ({ position }) => {
          if (!this.dragColBreak) return;
          const resultX = this.limitColLeft(position.x);
          const rootRect = this.quill.root.getBoundingClientRect();
          this.dragColBreak.style.left = `${resultX - rootRect.x}px`;
        },
        onEnd: ({ position }) => {
          this.dragging = false;

          this.updateTableCol(position.x);
          this.removeBreak();
        },
      });
      this.stopColDrag.push(stop);

      el.addEventListener('dragstart', e => e.preventDefault());
    }
  }

  findDragRowIndex() {
    return this.draggingRowIndex;
  }

  bindRowEvents() {
    const tableRowHeads = Array.from(this.root.getElementsByClassName(this.bem.be('row-header'))) as HTMLElement[];
    const tableRowHeadSeparators = Array.from(this.root.getElementsByClassName(this.bem.be('row-separator'))) as HTMLElement[];

    addScrollEvent.call(this, this.tableWrapperBlot!.domNode, () => {
      this.rowHeadWrapper!.scrollTop = this.tableWrapperBlot!.domNode.scrollTop;
    });

    for (const [i, el] of tableRowHeads.entries()) {
      el.addEventListener('click', this.handleResizerHeaderClick.bind(this, true, i));
    }

    if (this.stopRowDrag.length > 0) {
      for (const stop of this.stopRowDrag) stop();
      this.stopRowDrag = [];
    }
    for (const [i, el] of tableRowHeadSeparators.entries()) {
      const { stop } = dragElement(el, {
        axis: 'y',
        onStart: (position, e) => {
          this.dragging = true;

          this.draggingRowIndex = i;
          this.calculateRowDragRange();
          this.createRowBreak();
          if (!this.tableBlot) return;
          const tableWrapperRect = this.tableBlot.domNode.parentElement!.getBoundingClientRect();
          const { rect: tableRect } = getTableMainRect(this.tableBlot);
          if (!tableRect) return;
          // record current tablb rect to calculate the offset if have scroll when dragging
          this.startY = tableRect.y;
          const rootRect = this.quill.root.getBoundingClientRect();
          Object.assign(this.dragRowBreak!.style, {
            top: `${e.clientY - rootRect.y}px`,
            left: `${Math.max(tableWrapperRect.x, tableRect.x) - rootRect.x}px`,
            width: `${Math.min(tableWrapperRect.width, tableRect.width)}px`,
          });
        },
        onMove: ({ position }) => {
          if (!this.dragRowBreak || !this.table) return;
          const resultY = this.limitRowTop(position.y);
          const rootRect = this.quill.root.getBoundingClientRect();
          this.dragRowBreak.style.top = `${resultY - rootRect.y}px`;
        },
        onEnd: ({ position }) => {
          this.dragging = false;

          this.updateTableRow(position.y);
          this.removeBreak();
        },
      });
      this.stopRowDrag.push(stop);

      el.addEventListener('dragstart', e => e.preventDefault());
    }
  }

  update() {
    if (!this.tableBlot || !this.tableWrapperBlot) return;
    const { rect: tableRect } = getTableMainRect(this.tableBlot);
    if (!tableRect) return;

    this.root.innerHTML = '';

    const tableCols = this.tableBlot.getCols();
    const tableRows = this.tableBlot.getRows();
    const tableWrapperRect = this.tableWrapperBlot.domNode.getBoundingClientRect();
    const rootRect = this.quill.root.getBoundingClientRect();
    Object.assign(this.root.style, {
      top: `${Math.max(tableRect.y, tableWrapperRect.y) - rootRect.y}px`,
      left: `${Math.max(tableRect.x, tableWrapperRect.x) - rootRect.x}px`,
    });

    if (tableCols.length > 0 && tableRows.length > 0) {
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

    if (tableCols.length > 0) {
      let colHeadStr = '';
      for (const col of tableCols) {
        let width = col.domNode.getBoundingClientRect().width;
        if (width === 0) {
          width = Number.parseInt(col.domNode.getAttribute('width')!, 10);
        }
        colHeadStr += `<div class="${this.bem.be('col-header')}" style="width: ${width}px">
          <div class="${this.bem.be('col-separator')}" style="height: ${tableRect.height + this.size - 3}px"></div>
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
        width: `${tableRect.width}px`,
      });
      colHead.innerHTML = colHeadStr;
      colHeadWrapper.appendChild(colHead);
      this.root.appendChild(colHeadWrapper);
      colHeadWrapper.scrollLeft = this.tableWrapperBlot.domNode.scrollLeft;
      this.colHeadWrapper = colHeadWrapper;
      this.bindColEvents();
    }

    if (tableRows.length > 0) {
      let rowHeadStr = '';
      for (const row of tableRows) {
        const height = `${row.domNode.getBoundingClientRect().height}px`;
        rowHeadStr += `<div class="${this.bem.be('row-header')}" style="height: ${Number.parseFloat(height)}px">
          <div class="${this.bem.be('row-separator')}" style="width: ${tableRect.width + this.size - 3}px"></div>
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
        height: `${tableRect.height}px`,
      });
      rowHead.innerHTML = rowHeadStr;
      rowHeadWrapper.appendChild(rowHead);
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
    if (!this.table || !this.tableBlot) return;

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
