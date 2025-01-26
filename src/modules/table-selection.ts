import type { Parchment as TypeParchment } from 'quill';
import type { TableUp } from '..';
import type { TableMainFormat, TableWrapperFormat } from '../formats';
import type { InternalModule, RelactiveRect, TableSelectionOptions } from '../utils';
import Quill from 'quill';
import { TableCellFormat, TableCellInnerFormat } from '../formats';
import { addScrollEvent, blotName, clearScrollEvent, createBEM, findAllParentBlot, getRelativeRect, isRectanglesIntersect } from '../utils';

const ERROR_LIMIT = 0;
const IsFirstResizeObserve = Symbol('IsFirstResizeObserve');
type ResizeObserveTarget = HTMLElement & { [IsFirstResizeObserve]?: boolean };

interface SelectionData {
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
  bem = createBEM('selection');
  shiftKeyDown: boolean = false;
  keySelectionChange: boolean = false;
  lastSelection: SelectionData = {
    anchorNode: null,
    anchorOffset: 0,
    focusNode: null,
    focusOffset: 0,
  };

  constructor(public tableModule: TableUp, public quill: Quill, options: Partial<TableSelectionOptions> = {}) {
    this.options = this.resolveOptions(options);

    this.cellSelectWrap = tableModule.addContainer(this.bem.b());
    this.cellSelect = this.helpLinesInitial();

    this.resizeObserver = new ResizeObserver((entries) => {
      // prevent the element first bind
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

    this.quill.root.addEventListener('mousedown', this.mouseDownHandler, false);
    this.quill.root.addEventListener('keydown', (event) => {
      const selectionKey = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'End', 'Home', 'PageDown', 'PageUp']);
      if (event.shiftKey) {
        this.shiftKeyDown = true;
        if (selectionKey.has(event.key)) {
          this.keySelectionChange = true;
        }
      }
    });
    this.quill.root.addEventListener('keyup', (event) => {
      if (event.key === 'Shift') {
        this.shiftKeyDown = false;
      }
    });
    document.addEventListener('selectionchange', this.selectionChangeHandler);

    if (this.options.tableMenu) {
      this.tableMenu = new this.options.tableMenu(tableModule, quill, this.options.tableMenuOptions);
    }
    this.hide();
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
  };

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
  };

  selectionChangeHandler = () => {
    const selection = window.getSelection();
    const isKeySelectionChange = this.keySelectionChange;
    this.keySelectionChange = false;
    if (!selection) return;
    const { anchorNode, focusNode, anchorOffset, focusOffset } = selection;
    if (!anchorNode || !focusNode) return;

    const anchorBlot = Quill.find(anchorNode) as TypeParchment.Blot;
    const focusBlot = Quill.find(focusNode) as TypeParchment.Blot;
    if (!anchorBlot || !focusBlot || anchorBlot.scroll !== this.quill.scroll || focusBlot.scroll !== this.quill.scroll) return;

    const anchorNames = findAllParentBlot(anchorBlot);
    const focusNames = findAllParentBlot(focusBlot);

    if (
      anchorBlot
      && anchorBlot.statics.blotName === blotName.tableWrapper
      && focusBlot
      && focusBlot.statics.blotName === blotName.tableWrapper
    ) {
      const tempRange = document.createRange();
      tempRange.setStart(anchorNode, anchorOffset);
      tempRange.setEnd(focusNode, focusOffset);
      const isPoint = tempRange.collapsed;
      // if selection collapsed and cursor at the start of tableWrapper.
      // is cursor move front from table cell. so set cursor to the end of prev node.
      if (anchorOffset === 0 && isPoint) {
        const prevNode = this.getFirstTextNode(anchorBlot.prev!.domNode);
        const prevOffset = this.getNodeTailOffset(prevNode);
        return this.setSelectionData(selection, {
          anchorNode: prevNode,
          anchorOffset: prevOffset,
          focusNode: prevNode,
          focusOffset: prevOffset,
        });
      }
      return this.quill.blur();
    }
    // defect: mousedown at tableWrapper to selection will collapse selection to point
    // // If anchor is at tableWrapper and offset is 0, move to the previous row, without changing focus
    // // If anchor is at tableWrapper and offset is 1, move to the next row, without changing focus
    // // If focus is at tableWrapper and offset is 0, move to the previous row, without changing anchor
    // // If focus is at tableWrapper and offset is 1, move to the next row, without changing anchor
    // if (anchorBlot && anchorBlot.statics.blotName === blotName.tableWrapper) {
    //   if (anchorOffset === 0) {
    //     const newAnchorNode = this.getFirstTextNode(anchorBlot.prev!.domNode);
    //     const newAnchorOffset = this.getNodeTailOffset(newAnchorNode);
    //     return this.setSelectionData(selection, {
    //       anchorNode: newAnchorNode,
    //       anchorOffset: newAnchorOffset,
    //       focusNode,
    //       focusOffset,
    //     });
    //   }
    //   else if (anchorOffset === 1) {
    //     const newAnchorNode = this.getLastTextNode(anchorBlot.next!.domNode);
    //     const newAnchorOffset = 0;
    //     return this.setSelectionData(selection, {
    //       anchorNode: newAnchorNode,
    //       anchorOffset: newAnchorOffset,
    //       focusNode,
    //       focusOffset,
    //     });
    //   }
    // }
    // if (focusBlot && focusBlot.statics.blotName === blotName.tableWrapper) {
    //   if (focusOffset === 0) {
    //     const newFocusNode = this.getFirstTextNode(focusBlot.prev!.domNode);
    //     const newFocusOffset = this.getNodeTailOffset(newFocusNode);
    //     return this.setSelectionData(selection, {
    //       anchorNode,
    //       anchorOffset,
    //       focusNode: newFocusNode,
    //       focusOffset: newFocusOffset,
    //     });
    //   }
    //   else if (focusOffset === 1) {
    //     const newFocusNode = this.getFirstTextNode(focusBlot.next!.domNode);
    //     const newFocusOffset = 0;
    //     return this.setSelectionData(selection, {
    //       anchorNode,
    //       anchorOffset,
    //       focusNode: newFocusNode,
    //       focusOffset: newFocusOffset,
    //     });
    //   }
    // }

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
      if (isKeySelectionChange) {
        // limit selection in current cell
        this.setSelectionData(selection, this.lastSelection);
      }
      else {
        // mouse selection cover all table
        const isUpFromDown = this.selectionDirectionUp(selection);
        const tableWrapperBlot = isAnchorInCellInner
          ? anchorNames.get(blotName.tableWrapper) as TableWrapperFormat
          : focusNames.get(blotName.tableWrapper) as TableWrapperFormat;

        // 从 tableWrapper 的 0 开始选择还是会出现选区翻转，禁止掉在 tableWrapper 的 0 和 1 的选择: 方式是不允许选择在 tableWrapper
        const nextNode = this.getLastTextNode(tableWrapperBlot.next!.domNode);
        const prevNode = this.getFirstTextNode(tableWrapperBlot.prev!.domNode);
        let { startNode, startOffset, endNode, endOffset } = this.findWrapSelection([
          { node: prevNode, offset: this.getNodeTailOffset(prevNode) },
          { node: nextNode, offset: 0 },
          { node: anchorNode, offset: anchorOffset },
          { node: focusNode, offset: focusOffset },
        ]);
        if (isUpFromDown) {
          [startNode, startOffset, endNode, endOffset] = [endNode, endOffset, startNode, startOffset];
        }
        this.lastSelection = {
          anchorNode: startNode,
          anchorOffset: startOffset,
          focusNode: endNode,
          focusOffset: endOffset,
        };
        this.setSelectionData(selection, this.lastSelection);
      }

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
    if (this.shiftKeyDown) return;
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
    if (this.tableMenu) {
      this.tableMenu.hide();
    }
    if (this.tableModule.tableResize) {
      this.tableModule.tableResize.hide();
    }

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

    this.quill.root.removeEventListener('mousedown', this.mouseDownHandler, false);
    document.removeEventListener('selectionchange', this.selectionChangeHandler);
  }
}
