import type { Parchment as TypeParchment } from 'quill';
import type TableUp from '..';
import type { TableColFormat, TableMainFormat, TableRowFormat } from '..';
import type { TableResizeOptions } from '../utils';
import Quill from 'quill';
import { addScrollEvent, clearScrollEvent } from '../utils';
import { TableResizeCommon } from './table-resize-common';

export class TableResize extends TableResizeCommon {
  options: TableResizeOptions;
  root!: HTMLElement;
  tableMain: TableMainFormat;
  tableWrapper!: TypeParchment.Parent;
  resizeObserver!: ResizeObserver;
  tableCols: TableColFormat[] = [];
  tableRows: TableRowFormat[] = [];
  rowHeadWrapper: HTMLElement | null = null;
  colHeadWrapper: HTMLElement | null = null;
  scrollHandler: [HTMLElement, (e: Event) => void][] = [];

  constructor(public tableModule: TableUp, public table: HTMLElement, quill: Quill, options: Partial<TableResizeOptions>) {
    super(quill);
    this.options = this.resolveOptions(options);
    this.tableMain = Quill.find(this.table) as TableMainFormat;

    if (!this.tableMain) return;
    this.tableWrapper = this.tableMain.parent;
    if (!this.tableWrapper) return;

    this.root = this.tableModule.addContainer('ql-table-resizer');
    this.resizeObserver = new ResizeObserver(() => {
      this.showTool();
    });
    this.resizeObserver.observe(this.table);
  }

  resolveOptions(options: Partial<TableResizeOptions>) {
    return Object.assign({
      size: 12,
    }, options);
  }

  handleResizerHeader(isX: boolean, e: MouseEvent) {
    const { clientX, clientY } = e;
    const tableRect = this.table.getBoundingClientRect();
    if (this.tableModule.tableSelection) {
      const tableSelection = this.tableModule.tableSelection;
      tableSelection.selectedTds = tableSelection.computeSelectedTds(
        { x: clientX, y: clientY },
        { x: isX ? tableRect.right : clientX, y: isX ? clientY : tableRect.bottom },
      );
      tableSelection.showSelection();
    }
  };

  findCurrentColIndex(e: MouseEvent): number {
    return Array.from(this.root.getElementsByClassName('ql-table-col-separator')).indexOf(e.target as HTMLElement);
  }

  colWidthChange(i: number, w: number, isFull: boolean) {
    const tableColHeads = Array.from(this.root.getElementsByClassName('ql-table-col-header')) as HTMLElement[];
    tableColHeads[i].style.width = `${w}${isFull ? '%' : 'px'}`;
  }

  handleColMouseDownFunc = function (this: TableResize, e: MouseEvent) {
    const value = this.handleColMouseDown(e);
    if (value) {
      Object.assign(this.dragColBreak!.style, {
        top: `${value.top - this.options.size}px`,
        left: `${value.left}px`,
        height: `${value.height + this.options.size}px`,
      });
    }
    return value;
  }.bind(this);

  bindColEvents() {
    const tableColHeads = Array.from(this.root.getElementsByClassName('ql-table-col-header')) as HTMLElement[];
    const tableColHeadSeparators = Array.from(this.root.getElementsByClassName('ql-table-col-separator')) as HTMLElement[];

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
    return Array.from(this.root.getElementsByClassName('ql-table-row-separator')).indexOf(e.target as HTMLElement);
  }

  rowHeightChange(i: number, h: number) {
    const tableRowHeads = Array.from(this.root.getElementsByClassName('ql-table-row-header')) as HTMLElement[];
    tableRowHeads[i].style.height = `${h}px`;
  }

  handleRowMouseDownFunc = function (this: TableResize, e: MouseEvent) {
    const value = this.handleRowMouseDown(e);
    if (value) {
      Object.assign(this.dragRowBreak!.style, {
        top: `${value.top}px`,
        left: `${value.left - this.options.size}px`,
        width: `${value.width + this.options.size}px`,
      });
    }
    return value;
  }.bind(this);

  bindRowEvents() {
    const tableRowHeads = Array.from(this.root.getElementsByClassName('ql-table-row-header')) as HTMLElement[];
    const tableRowHeadSeparators = Array.from(this.root.getElementsByClassName('ql-table-row-separator')) as HTMLElement[];

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

  updateRootPosition() {
    const tableWrapperRect = this.tableWrapper.domNode.getBoundingClientRect();
    const rootRect = this.quill.root.getBoundingClientRect();
    Object.assign(this.root.style, {
      top: `${tableWrapperRect.y - rootRect.y}px`,
      left: `${tableWrapperRect.x - rootRect.x}px`,
    });
  }

  showTool() {
    this.tableCols = this.tableMain.getCols();
    this.tableRows = this.tableMain.getRows();
    this.root.innerHTML = '';
    const tableWrapperRect = this.tableWrapper.domNode.getBoundingClientRect();
    const tableMainRect = this.tableMain.domNode.getBoundingClientRect();
    const rootRect = this.quill.root.getBoundingClientRect();
    Object.assign(this.root.style, {
      top: `${tableWrapperRect.y - rootRect.y}px`,
      left: `${tableWrapperRect.x - rootRect.x}px`,
    });

    if (this.tableCols.length > 0 && this.tableRows.length > 0) {
      const corner = document.createElement('div');
      corner.classList.add('ql-table-resizer-corner');
      Object.assign(corner.style, {
        width: `${this.options.size}px`,
        height: `${this.options.size}px`,
        transform: `translate(-${this.options.size}px, -${this.options.size}px)`,
      });
      this.root.appendChild(corner);
    }

    if (this.tableCols.length > 0) {
      let colHeadStr = '';
      for (const col of this.tableCols) {
        let width = col.width + (this.tableMain.full ? '%' : 'px');
        if (!col.width) {
          width = `${col.domNode.getBoundingClientRect().width}px`;
        }
        colHeadStr += `<div class="ql-table-col-header" style="width: ${width}">
          <div class="ql-table-col-separator" style="height: ${tableMainRect.height + this.options.size - 3}px"></div>
        </div>`;
      }
      const colHeadWrapper = document.createElement('div');
      colHeadWrapper.classList.add('ql-table-resizer-col');
      const colHead = document.createElement('div');
      colHead.classList.add('ql-table-col-wrapper');
      Object.assign(colHeadWrapper.style, {
        transform: `translateY(-${this.options.size}px)`,
        width: `${tableWrapperRect.width}px`,
        height: `${this.options.size}px`,
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
      for (const row of this.tableRows) {
        const height = `${row.domNode.getBoundingClientRect().height}px`;
        rowHeadStr += `<div class="ql-table-row-header" style="height: ${height}">
          <div class="ql-table-row-separator" style="width: ${tableMainRect.width + this.options.size - 3}px"></div>
        </div>`;
      }
      const rowHeadWrapper = document.createElement('div');
      rowHeadWrapper.classList.add('ql-table-resizer-row');
      const rowHead = document.createElement('div');
      rowHead.classList.add('ql-table-row-wrapper');

      Object.assign(rowHeadWrapper.style, {
        transform: `translateX(-${this.options.size}px)`,
        width: `${this.options.size}px`,
        height: `${tableWrapperRect.height}px`,
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

    addScrollEvent.call(this, this.quill.root, () => {
      this.updateRootPosition();
    });
  }

  hideTool() {
    this.root.classList.add('ql-hidden');
  }

  destroy() {
    this.hideTool();
    clearScrollEvent.call(this);
    this.resizeObserver.disconnect();
    for (const [dom, handle] of this.scrollHandler) {
      dom.removeEventListener('scroll', handle);
    }
    this.root.remove();
  }
}
