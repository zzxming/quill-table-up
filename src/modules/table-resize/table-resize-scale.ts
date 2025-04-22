import type { TableUp } from '../../table-up';
import type { TableResizeScaleOptions } from '../../utils';
import Quill from 'quill';
import { TableBodyFormat, type TableColFormat, type TableMainFormat, type TableRowFormat, type TableWrapperFormat } from '../../formats';
import { addScrollEvent, clearScrollEvent, createBEM, findChildBlot, tableUpSize } from '../../utils';
import { isTableAlignRight } from './utils';

export class TableResizeScale {
  scrollHandler: [HTMLElement, (e: Event) => void][] = [];
  tableMainBlot: TableMainFormat | null = null;
  tableWrapperBlot: TableWrapperFormat | null = null;
  bem = createBEM('scale');
  startX: number = 0;
  startY: number = 0;
  offset: number = 6;
  options: TableResizeScaleOptions;
  root?: HTMLElement;
  block?: HTMLElement;
  resizeobserver: ResizeObserver = new ResizeObserver(() => this.update());
  constructor(public tableModule: TableUp, public table: HTMLElement, public quill: Quill, options: Partial<TableResizeScaleOptions>) {
    this.options = this.resolveOptions(options);
    this.tableMainBlot = Quill.find(table) as TableMainFormat;

    if (this.tableMainBlot && !this.tableMainBlot.full) {
      this.tableWrapperBlot = this.tableMainBlot.parent as TableWrapperFormat;
      this.buildResizer();
      this.show();
    }
    this.quill.on(Quill.events.TEXT_CHANGE, this.updateWhenTextChange);
  }

  updateWhenTextChange = () => {
    this.update();
  };

  resolveOptions(options: Partial<TableResizeScaleOptions>) {
    return Object.assign({
      blockSize: 12,
    }, options);
  }

  buildResizer() {
    if (!this.tableMainBlot || !this.tableWrapperBlot) return;
    this.root = this.tableModule.addContainer(this.bem.b());
    this.root.classList.add(this.bem.is('hidden'));
    this.block = document.createElement('div');
    this.block.classList.add(this.bem.be('block'));
    Object.assign(this.block.style, {
      width: `${this.options.blockSize}px`,
      height: `${this.options.blockSize}px`,
    });
    this.root.appendChild(this.block);

    let originColWidth: { blot: TableColFormat; width: number }[] = [];
    let originRowHeight: { blot: TableRowFormat; height: number }[] = [];
    const handleMouseMove = (e: MouseEvent) => {
      if (!this.tableMainBlot) return;
      // divide equally by col count/row count
      const isRight = isTableAlignRight(this.tableMainBlot) ? -1 : 1;
      const diffX = (e.clientX - this.startX) * isRight;
      const diffY = e.clientY - this.startY;
      const itemWidth = Math.floor(diffX / originColWidth.length);
      const itemHeight = Math.floor(diffY / originRowHeight.length);

      for (const { blot, width } of originColWidth) {
        blot.width = Math.max(width + itemWidth, tableUpSize.colMinWidthPx);
      }
      for (const { blot, height } of originRowHeight) {
        blot.setHeight(`${Math.max(height + itemHeight, tableUpSize.rowMinHeightPx)}px`);
      }
    };
    const handleMouseUp = () => {
      originColWidth = [];
      originRowHeight = [];
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    this.block.addEventListener('mousedown', (e) => {
      if (!this.tableMainBlot || this.isTableOutofEditor()) return;
      this.startX = e.clientX;
      this.startY = e.clientY;
      // save the origin width and height to calculate result width and height
      originColWidth = this.tableMainBlot.getCols().map(col => ({ blot: col, width: Math.floor(col.width) }));
      originRowHeight = this.tableMainBlot.getRows().map(row => ({ blot: row, height: Math.floor(row.domNode.getBoundingClientRect().height) }));
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
    this.block.addEventListener('dragstart', e => e.preventDefault());

    this.resizeobserver.observe(this.tableMainBlot.domNode);
    addScrollEvent.call(this, this.quill.root, () => this.update());
    addScrollEvent.call(this, this.tableWrapperBlot.domNode, () => this.update());
  }

  isTableOutofEditor(): boolean {
    if (!this.tableMainBlot || !this.tableWrapperBlot || this.tableMainBlot.full) return false;
    // if tableMain width larger than tableWrapper. reset tableMain width equal editor width
    const tableRect = this.tableMainBlot.domNode.getBoundingClientRect();
    const tableWrapperRect = this.tableWrapperBlot.domNode.getBoundingClientRect();
    // equal scale
    if (tableRect.width > tableWrapperRect.width) {
      for (const col of this.tableMainBlot.getCols()) {
        col.width = Math.floor((col.width / tableRect.width) * tableWrapperRect.width);
      }
      this.tableMainBlot.colWidthFillTable();
      return true;
    }
    return false;
  }

  update() {
    if (!this.block || !this.root || !this.tableMainBlot || !this.tableWrapperBlot) return;
    if (this.tableMainBlot.full) {
      this.hide();
      return;
    }
    const [tableBody] = findChildBlot(this.tableMainBlot, TableBodyFormat);
    if (!tableBody) return;
    const tableRect = tableBody.domNode.getBoundingClientRect();
    const tableWrapperRect = this.tableWrapperBlot.domNode.getBoundingClientRect();
    const editorRect = this.quill.root.getBoundingClientRect();
    const { scrollTop, scrollLeft } = this.tableWrapperBlot.domNode;
    const blockSize = this.options.blockSize * 2 + this.offset;
    const rootWidth = Math.min(tableRect.width, tableWrapperRect.width) + blockSize;
    const rootHeight = Math.min(tableRect.height, tableWrapperRect.height) + blockSize;
    Object.assign(this.root.style, {
      width: `${rootWidth}px`,
      height: `${rootHeight}px`,
      left: `${Math.max(tableRect.x, tableWrapperRect.x) - editorRect.x - this.options.blockSize}px`,
      top: `${Math.max(tableRect.y, tableWrapperRect.y) - editorRect.y - this.options.blockSize}px`,
    });
    const blockStyle = {
      left: `${tableRect.width + blockSize - scrollLeft}px`,
      top: `${rootHeight - scrollTop}px`,
    };
    if (isTableAlignRight(this.tableMainBlot)) {
      this.root.classList.add(this.bem.is('align-right'));
      blockStyle.left = `${this.options.blockSize + -1 * scrollLeft}px`;
    }
    else {
      this.root.classList.remove(this.bem.is('align-right'));
    }
    Object.assign(this.block.style, blockStyle);
  }

  show() {
    if (this.root) {
      this.root.classList.remove(this.bem.is('hidden'));
      this.update();
    }
  }

  hide() {
    if (this.root) {
      this.root.classList.add(this.bem.is('hidden'));
    }
  }

  destroy() {
    this.hide();
    this.quill.off(Quill.events.TEXT_CHANGE, this.updateWhenTextChange);
    if (this.root) {
      this.root.remove();
    }
    clearScrollEvent.call(this);
  }
}
