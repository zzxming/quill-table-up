import type { EmitterSource, Parchment as TypeParchment, Range as TypeRange } from 'quill';
import type { TableMainFormat, TableWrapperFormat } from '../formats';
import type { TableUp } from '../table-up';
import type { InternalModule, RelactiveRect, TableSelectionOptions } from '../utils';
import Quill from 'quill';
import { TableCellFormat, TableCellInnerFormat } from '../formats';
import { addScrollEvent, blotName, clearScrollEvent, createBEM, findAllParentBlot, getRelativeRect, isRectanglesIntersect, tableUpInternal } from '../utils';

const ERROR_LIMIT = 0;
const IsFirstResizeObserve = Symbol('IsFirstResizeObserve');
type ResizeObserveTarget = HTMLElement & { [IsFirstResizeObserve]?: boolean };
const Parchment = Quill.import('parchment');
const Delta = Quill.import('delta');

export interface SelectionData {
  anchorNode: Node | null;
  anchorOffset: number;
  focusNode: Node | null;
  focusOffset: number;
}

export class TableSelection {
  options: TableSelectionOptions;
  boundary: RelactiveRect | null = null;
  startScrollX: number = 0;
  startScrollY: number = 0;
  selectedTableScrollX: number = 0;
  selectedTableScrollY: number = 0;
  selectedEditorScrollX: number = 0;
  selectedEditorScrollY: number = 0;
  selectedTds: TableCellInnerFormat[] = [];
  cellSelectWrap: HTMLElement;
  cellSelect: HTMLElement;
  dragging: boolean = false;
  scrollHandler: [HTMLElement, (...args: any[]) => void][] = [];
  tableMenu?: InternalModule;
  resizeObserver: ResizeObserver;
  table?: HTMLTableElement;
  isDisplaySelection = false;
  bem = createBEM('selection');
  lastSelection: SelectionData = {
    anchorNode: null,
    anchorOffset: 0,
    focusNode: null,
    focusOffset: 0,
  };

  constructor(public tableModule: TableUp, public quill: Quill, options: Partial<TableSelectionOptions> = {}) {
    this.options = this.resolveOptions(options);

    this.quillHack();

    this.cellSelectWrap = tableModule.addContainer(this.bem.b());
    this.cellSelect = this.helpLinesInitial();

    this.resizeObserver = new ResizeObserver((entries) => {
      // prevent when element first bind
      if (entries.some((entry) => {
        const originVal = (entry.target as ResizeObserveTarget)[IsFirstResizeObserve];
        (entry.target as ResizeObserveTarget)[IsFirstResizeObserve] = false;
        return originVal;
      })) {
        return;
      }
      this.hide();
    });
    this.resizeObserver.observe(this.quill.root);

    this.quill.root.addEventListener('mousedown', this.mouseDownHandler, { passive: false });
    document.addEventListener('selectionchange', this.selectionChangeHandler, { passive: false });
    this.quill.on(Quill.events.SELECTION_CHANGE, this.quillSelectionChangeHandler);
    if (this.options.tableMenu) {
      this.tableMenu = new this.options.tableMenu(tableModule, quill, this.options.tableMenuOptions);
    }
    this.hide();
  }

  quillHack() {
    // tableSelection format cellInner style
    const originFormat = this.quill.format;
    this.quill.format = function (name: string, value: unknown, source: EmitterSource = Quill.sources.API) {
      const blot = this.scroll.query(name);
      // filter embed blot
      if (!((blot as TypeParchment.BlotConstructor).prototype instanceof Parchment.EmbedBlot)) {
        const tableUpModule = this.getModule(tableUpInternal.moduleName) as TableUp;
        if (tableUpModule && tableUpModule.tableSelection && tableUpModule.tableSelection.selectedTds.length > 0) {
          const selectedTds = tableUpModule.tableSelection.selectedTds;

          // calculate the format value. the format should be canceled when this value exists in all selected cells
          let setOrigin = false;
          let end = -1;
          const tdRanges = [];
          for (const innerTd of selectedTds) {
            const index = innerTd.offset(this.scroll);
            const length = innerTd.length();
            tdRanges.push({ index, length });
            const format = this.getFormat(index, length);
            if (format[name] !== value) {
              setOrigin = true;
            }

            end = index + length;
          }
          const resultValue = setOrigin ? value : false;

          const delta = new Delta();
          for (const [i, { index, length }] of tdRanges.entries()) {
            const lastIndex = i === 0 ? 0 : tdRanges[i - 1].index + tdRanges[i - 1].length;
            delta.retain(index - lastIndex).retain(length, { [name]: resultValue });
          }

          // set selection at the end of the last selected cell. (for make sure the toolbar handler get the origin correct value)
          this.setSelection(Math.max(0, end - 1), 0, Quill.sources.SILENT);
          return this.updateContents(delta);
        }
      }

      return originFormat.call(this, name, value, source);
    };
  }

  getFirstTextNode(dom: HTMLElement | Node): Node {
    for (const node of Array.from(dom.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        return node;
      }
    }
    return dom;
  }

  getLastTextNode(dom: HTMLElement | Node): Node {
    for (let i = dom.childNodes.length - 1; i >= 0; i--) {
      const node = dom.childNodes[i];
      if (node.nodeType === Node.TEXT_NODE) {
        return node;
      }
    }
    return dom;
  }

  getNodeTailOffset(node: Node) {
    const tempRange = document.createRange();
    tempRange.selectNodeContents(node);
    tempRange.collapse(false);
    return tempRange.startOffset;
  }

  quillSelectionChangeHandler = (range: TypeRange | null, _oldRange: TypeRange | null, source: EmitterSource) => {
    if (source === Quill.sources.API) return;
    if (range && this.isDisplaySelection) {
      const formats = this.quill.getFormat(range);
      const [line] = this.quill.getLine(range.index);
      let isInChildren = !!formats[blotName.tableCellInner] && !!line;
      if (isInChildren) {
        isInChildren &&= this.selectedTds.some(td => td.children.contains(line!));
      }
      if (!isInChildren) {
        this.hide();
      }
    }
  };

  setSelectionData(selection: Selection, selectionData: SelectionData) {
    const { anchorNode, anchorOffset, focusNode, focusOffset } = selectionData;
    if (!anchorNode || !focusNode) return;
    const range = document.createRange();
    const isUpFromDown = this.selectionDirectionUp(selectionData);
    if (isUpFromDown) {
      range.setStart(anchorNode, anchorOffset);
      range.setEnd(anchorNode, anchorOffset);
    }
    else {
      range.setStart(anchorNode, anchorOffset);
      range.setEnd(focusNode, focusOffset);
    }
    selection.removeAllRanges();
    selection.addRange(range);
    if (isUpFromDown) {
      selection.extend(focusNode, focusOffset);
    }
  }

  selectionDirectionUp(selection: SelectionData) {
    const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
    if (!anchorNode || !focusNode) return false;

    if (anchorNode === focusNode) {
      return anchorOffset > focusOffset;
    }

    const nodePosition = anchorNode.compareDocumentPosition(focusNode);
    // focus contains anchor
    if (nodePosition & Node.DOCUMENT_POSITION_CONTAINS) {
      // is anchor before focus
      return (nodePosition & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    }

    // anchor contains focus
    if (nodePosition & Node.DOCUMENT_POSITION_CONTAINED_BY) {
      // is focus before anchor
      return (nodePosition & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    }

    // compare position
    return (nodePosition & Node.DOCUMENT_POSITION_PRECEDING) !== 0;
  }

  findWrapSelection(points: { node: Node | null; offset: number }[]) {
    let startNode: Node | null = null;
    let startOffset = 0;
    let endNode: Node | null = null;
    let endOffset = 0;

    for (const { node, offset } of points) {
      if (node) {
        if (
          !startNode
          || this.selectionDirectionUp({
            anchorNode: startNode,
            anchorOffset: startOffset,
            focusNode: node,
            focusOffset: offset,
          })
        ) {
          startNode = node;
          startOffset = offset;
        }

        if (
          !endNode
          || this.selectionDirectionUp({
            anchorNode: node,
            anchorOffset: offset,
            focusNode: endNode,
            focusOffset: endOffset,
          })
        ) {
          endNode = node;
          endOffset = offset;
        }
      }
    }

    return { startNode, startOffset, endNode, endOffset };
  }

  resolveOptions(options: Partial<TableSelectionOptions>): TableSelectionOptions {
    return Object.assign({
      selectColor: '#0589f340',
      tableMenuOptions: {},
    } as TableSelectionOptions, options);
  }

  selectionChangeHandler = () => {
    const selection = window.getSelection();
    if (!selection) return;
    const { anchorNode, focusNode, anchorOffset, focusOffset } = selection;
    if (!anchorNode || !focusNode) return;

    const anchorBlot = Quill.find(anchorNode) as TypeParchment.Blot;
    const focusBlot = Quill.find(focusNode) as TypeParchment.Blot;
    if (!anchorBlot || !focusBlot || anchorBlot.scroll !== this.quill.scroll || focusBlot.scroll !== this.quill.scroll) return;

    const anchorNames = findAllParentBlot(anchorBlot);
    const focusNames = findAllParentBlot(focusBlot);

    // if cursor into colgourp should into table or out table by lastSelection
    const isAnchorInColgroup = anchorNames.has(blotName.tableColgroup);
    const isFocusInColgroup = focusNames.has(blotName.tableColgroup);
    if (isAnchorInColgroup || isFocusInColgroup) {
      let newAnchorNode = anchorNode;
      let newAnchorOffset = anchorOffset;
      let newFocusNode = focusNode;
      let newFocusOffset = focusOffset;
      // default move cursor to first cell
      if (isAnchorInColgroup) {
        const tableWrapperBlot = anchorNames.get(blotName.tableWrapper) as TableWrapperFormat;
        newAnchorNode = tableWrapperBlot.descendants(TableCellInnerFormat)[0].domNode;
        newAnchorOffset = 0;
      }
      if (isFocusInColgroup) {
        const tableWrapperBlot = focusNames.get(blotName.tableWrapper) as TableWrapperFormat;
        newFocusNode = tableWrapperBlot.descendants(TableCellInnerFormat)[0].domNode;
        newFocusOffset = 0;
      }
      this.setSelectionData(selection, {
        anchorNode: newAnchorNode,
        anchorOffset: newAnchorOffset,
        focusNode: newFocusNode,
        focusOffset: newFocusOffset,
      });
      return;
    }

    // if the selection in the table partial
    const isAnchorInCellInner = anchorNames.has(blotName.tableCellInner);
    const isFocusInCellInner = focusNames.has(blotName.tableCellInner);
    let isNotSameCellInner = isAnchorInCellInner && isFocusInCellInner;
    if (isNotSameCellInner) {
      const anchorCellBlot = anchorNames.get(blotName.tableCellInner) as TableCellInnerFormat;
      const focusCellBlot = focusNames.get(blotName.tableCellInner) as TableCellInnerFormat;
      isNotSameCellInner &&= (anchorCellBlot !== focusCellBlot);
    }
    if (
      (isAnchorInCellInner && isFocusInCellInner && isNotSameCellInner)
      || (!isAnchorInCellInner && isFocusInCellInner)
      || (!isFocusInCellInner && isAnchorInCellInner)
    ) {
      this.setSelectionData(selection, this.lastSelection);
      if (this.selectedTds.length > 0) {
        this.hide();
      }
      return;
    }

    this.lastSelection = {
      anchorNode,
      anchorOffset,
      focusNode,
      focusOffset,
    };
  };

  helpLinesInitial() {
    this.cellSelectWrap.style.setProperty('--select-color', this.options.selectColor);
    const cellSelect = document.createElement('div');
    cellSelect.classList.add(this.bem.be('line'));
    this.cellSelectWrap.appendChild(cellSelect);
    return cellSelect;
  }

  computeSelectedTds(startPoint: { x: number; y: number }, endPoint: { x: number; y: number }) {
    if (!this.table) return [];
    type TempSortedTableCellFormat = TableCellFormat & { index?: number; __rect?: DOMRect };

    const tableMain = Quill.find(this.table) as TableMainFormat;
    if (!tableMain) return [];
    // Use TableCell to calculation selected range, because TableCellInner is scrollable, the width will effect calculate
    const tableCells = new Set(
      // reverse cell. search from bottom.
      // when mouse click on the cell border. the selection will be in the lower cell.
      // but `isRectanglesIntersect` judge intersect include border. the upper cell bottom border will intersect with boundary
      // so need to search the cell from bottom
      (tableMain.descendants(TableCellFormat) as TempSortedTableCellFormat[]).map((cell, i) => {
        cell.index = i;
        return cell;
      }),
    );

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
        // bowser MouseEvent clientY\clientX is floored.judge data need floored too
        if (
          isRectanglesIntersect(
            { x: Math.floor(boundary.x), y: Math.floor(boundary.y), x1: Math.floor(boundary.x1), y1: Math.floor(boundary.y1) },
            { x: Math.floor(x), y: Math.floor(y), x1: Math.floor(right), y1: Math.floor(bottom) },
            ERROR_LIMIT,
            selectedCells.size === 0,
          )
        ) {
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
        // else if (x < boundary.x && y < boundary.y) {
        //   break;
        // }
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

  mouseDownHandler = (mousedownEvent: MouseEvent) => {
    const { button, target, clientX, clientY } = mousedownEvent;
    const closestTable = (target as HTMLElement).closest('.ql-table') as HTMLTableElement;
    if (button !== 0 || !closestTable) return;

    this.setSelectionTable(closestTable);
    const startTableId = closestTable.dataset.tableId;
    const startPoint = { x: clientX, y: clientY };
    const { x: tableScrollX, y: tableScrollY } = this.getTableViewScroll();
    this.startScrollX = tableScrollX;
    this.startScrollY = tableScrollY;
    this.selectedTds = this.computeSelectedTds(startPoint, startPoint);
    this.dragging = true;
    this.show();

    const mouseMoveHandler = (mousemoveEvent: MouseEvent) => {
      if (this.tableMenu) {
        this.tableMenu.hide();
      }
      if (this.tableModule.tableResize) {
        this.tableModule.tableResize.hide();
      }
      const { button, target, clientX, clientY } = mousemoveEvent;
      const closestTable = (target as HTMLElement).closest('.ql-table') as HTMLElement;
      if (
        button !== 0
        || !closestTable
        || closestTable.dataset.tableId !== startTableId
      ) {
        return;
      }

      const movePoint = { x: clientX, y: clientY };
      this.selectedTds = this.computeSelectedTds(startPoint, movePoint);
      if (this.selectedTds.length > 1) {
        this.quill.blur();
      }
      this.update();
    };
    const mouseUpHandler = () => {
      document.body.removeEventListener('mousemove', mouseMoveHandler, false);
      document.body.removeEventListener('mouseup', mouseUpHandler, false);
      this.dragging = false;
      this.startScrollX = 0;
      this.startScrollY = 0;
      if (this.tableMenu && this.selectedTds.length > 0) {
        this.tableMenu.update();
      }
    };

    document.body.addEventListener('mousemove', mouseMoveHandler, false);
    document.body.addEventListener('mouseup', mouseUpHandler, false);
  };

  updateWithSelectedTds() {
    if (this.selectedTds.length <= 0) return;
    const startPoint = { x: Infinity, y: Infinity };
    const endPoint = { x: -Infinity, y: -Infinity };
    for (const td of this.selectedTds) {
      const rect = td.domNode.getBoundingClientRect();
      startPoint.x = Math.min(startPoint.x, rect.left);
      startPoint.y = Math.min(startPoint.y, rect.top);
      endPoint.x = Math.max(endPoint.x, rect.right);
      endPoint.y = Math.max(endPoint.y, rect.bottom);
    }
    this.selectedTds = this.computeSelectedTds(startPoint, endPoint);
    if (this.selectedTds.length > 0) {
      this.show();
      this.update();
    }
  }

  update() {
    // skip `SCROLL_UPDATE`. SCROLL_UPDATE will trigger setNativeRange that will reset the selection
    this.quill.scroll.observer.disconnect();
    for (const td of Array.from(this.quill.root.querySelectorAll(`.ql-table .${this.bem.bm('selected')}`))) {
      td.classList.remove(`${this.bem.bm('selected')}`);
    }
    for (const td of this.selectedTds) {
      td.domNode.classList.add(`${this.bem.bm('selected')}`);
    }
    // rebind observer
    this.quill.scroll.observer.observe(this.quill.scroll.domNode, {
      attributes: true,
      characterData: true,
      characterDataOldValue: true,
      childList: true,
      subtree: true,
    });
    if (this.selectedTds.length === 0 || !this.boundary || !this.table) return;

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
      display: 'block',
      left: `${wrapLeft}px`,
      top: `${wrapTop}px`,
      width: `${tableWrapperRect.width + 2}px`,
      height: `${tableWrapperRect.height + 2}px`,
    });
    if (!this.dragging && this.tableMenu) {
      this.tableMenu.update();
    }
  }

  getQuillViewScroll() {
    return {
      x: this.quill.root.scrollLeft,
      y: this.quill.root.scrollTop,
    };
  }

  getTableViewScroll() {
    if (!this.table) {
      return {
        x: 0,
        y: 0,
      };
    }
    return {
      x: this.table.parentElement!.scrollLeft,
      y: this.table.parentElement!.scrollTop,
    };
  }

  setSelectionTable(table: HTMLTableElement | undefined) {
    if (this.table === table) return;
    if (this.table) {
      (this.table as ResizeObserveTarget)[IsFirstResizeObserve] = undefined;
      this.resizeObserver.unobserve(this.table);
    }
    this.table = table;
    if (this.table) {
      (this.table as ResizeObserveTarget)[IsFirstResizeObserve] = true;
      this.resizeObserver.observe(this.table);
    }
  }

  show() {
    if (!this.table) return;
    clearScrollEvent.call(this);

    this.isDisplaySelection = true;
    this.update();
    addScrollEvent.call(this, this.quill.root, () => {
      this.update();
    });
    addScrollEvent.call(this, this.table.parentElement!, () => {
      this.update();
    });
  }

  hide() {
    this.boundary = null;
    for (const td of this.selectedTds) {
      td.domNode.classList.remove(`${this.bem.bm('selected')}`);
    }
    this.selectedTds = [];
    this.cellSelectWrap && Object.assign(this.cellSelectWrap.style, { display: 'none' });
    this.setSelectionTable(undefined);
    if (this.tableMenu) {
      this.tableMenu.hide();
    }
  }

  destroy() {
    this.resizeObserver.disconnect();

    this.hide();
    this.cellSelectWrap.remove();
    if (this.tableMenu) {
      this.tableMenu.destroy();
    }
    clearScrollEvent.call(this);

    this.quill.root.removeEventListener('mousedown', this.mouseDownHandler);
    document.removeEventListener('selectionchange', this.selectionChangeHandler);
    this.quill.off(Quill.events.SELECTION_CHANGE, this.quillSelectionChangeHandler);
  }
}
