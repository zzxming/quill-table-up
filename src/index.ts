import Quill from 'quill';
import type { Range, Parchment as TypeParchment } from 'quill';
import type Picker from 'quill/ui/picker';
import type BaseTheme from 'quill/themes/base';
import type { Context } from 'quill/modules/keyboard';
import type Toolbar from 'quill/modules/toolbar';
import type Keyboard from 'quill/modules/keyboard';
import type { Delta as TypeDelta } from 'quill/core';
import type { BlockEmbed as TypeBlockEmbed } from 'quill/blots/block';
import type TypeBlock from 'quill/blots/block';
import type { TableColValue, TableTextOptions, TableUpOptions } from './utils';
import { blotName, createSelectBox, debounce, findParentBlot, findParentBlots, isFunction, randomId, tableColMinWidthPre, tableColMinWidthPx } from './utils';
import { BlockOverride, ScrollOverride, TableBodyFormat, TableCellFormat, TableCellInnerFormat, TableColFormat, TableColgroupFormat, TableMainFormat, TableRowFormat, TableWrapperFormat } from './formats';
import { TableResizeLine, TableSelection } from './modules';

const Delta = Quill.import('delta');
const Break = Quill.import('blots/break') as TypeParchment.BlotConstructor;
const icons = Quill.import('ui/icons') as Record<string, any>;

const createCell = (scroll: TypeParchment.ScrollBlot, { tableId, rowId, colId }: { tableId: string; rowId: string; colId: string }) => {
  const value = {
    tableId,
    rowId,
    colId,
    colspan: 1,
    rowspan: 1,
  };
  const tableCell = scroll.create(blotName.tableCell, value) as TypeParchment.ParentBlot;
  const tableCellInner = scroll.create(blotName.tableCellInner, value) as TypeParchment.ParentBlot;
  const block = scroll.create('block') as TypeParchment.ParentBlot;
  block.appendChild(scroll.create('break'));
  tableCellInner.appendChild(block);
  tableCell.appendChild(tableCellInner);

  return tableCell;
};

// Blots that cannot be inserted into a table
export const tableCantInsert: string[] = [blotName.tableCell];
const isForbidInTableBlot = (blot: TypeParchment.Blot) => tableCantInsert.includes(blot.statics.blotName);
const isForbidInTable = (current: TypeParchment.Blot): boolean =>
  current && current.parent
    ? isForbidInTableBlot(current.parent)
      ? true
      : isForbidInTable(current.parent)
    : false;

type QuillThemePicker = (Picker & { options: HTMLElement });
interface QuillTheme extends BaseTheme {
  pickers: QuillThemePicker[];
}

export class TableUp {
  static moduleName = 'tableUp';
  static toolName = blotName.tableMain;
  static keyboradHandler = {
    'forbid remove table by backspace': {
      bindInHead: true,
      key: 'Backspace',
      collapsed: true,
      offset: 0,
      handler(this: { quill: Quill }, range: Range, context: Context) {
        const line = this.quill.getLine(range.index);
        const blot = line[0] as TypeParchment.BlockBlot;
        if (blot.prev instanceof TableWrapperFormat) {
          blot.prev.remove();
          return true;
        }

        if (context.format[blotName.tableCellInner]) {
          const offset = blot.offset(findParentBlot(blot, blotName.tableCellInner));
          if (offset === 0) {
            return false;
          }
        }
        return true;
      },
    },
    'forbid remove table by delete': {
      bindInHead: true,
      key: 'Delete',
      collapsed: true,
      handler(this: { quill: Quill }, range: Range, context: Context) {
        const line = this.quill.getLine(range.index);
        const blot = line[0] as TypeParchment.BlockBlot;
        const offsetInline = line[1];
        if ((blot.next instanceof TableWrapperFormat || blot.next instanceof TableColFormat) && offsetInline === blot.length() - 1) return false;

        if (context.format[blotName.tableCellInner]) {
          const tableInnerBlot = findParentBlot(blot, blotName.tableCellInner);
          if (blot === tableInnerBlot.children.tail && offsetInline === blot.length() - 1) {
            return false;
          }
        }
        return true;
      },
    },
    'after table insert new line': {
      // lick 'code exit'
      bindInHead: true,
      key: 'Enter',
      collapsed: true,
      format: [blotName.tableCellInner],
      prefix: /^$/,
      suffix: /^\s*$/,
      handler(this: { quill: Quill }, range: Range) {
        const [line, offset] = this.quill.getLine(range.index);
        const format = this.quill.getFormat(range.index + offset + 1, 1);
        // next line still in table. not exit
        if (format[blotName.tableCellInner]) {
          return true;
        }
        // if have tow empty lines in table cell. enter will exit table and add a new line after table
        let numLines = 2;
        let cur = line;
        while (cur !== null && cur.length() <= 1) {
          cur = cur.prev as TypeBlock | TypeBlockEmbed | null;
          numLines -= 1;
          if (numLines <= 0) {
            this.quill.insertText(range.index + 1, '\n');
            this.quill.setSelection(range.index + 1, Quill.sources.SILENT);
            return false;
          }
        }
        return true;
      },
    },
  };

  static register() {
    TableWrapperFormat.allowedChildren = [TableMainFormat];

    TableMainFormat.allowedChildren = [TableBodyFormat, TableColgroupFormat];
    TableMainFormat.requiredContainer = TableWrapperFormat;

    TableColgroupFormat.allowedChildren = [TableColFormat];
    TableColgroupFormat.requiredContainer = TableMainFormat;

    TableBodyFormat.allowedChildren = [TableRowFormat];
    TableBodyFormat.requiredContainer = TableMainFormat;

    TableRowFormat.allowedChildren = [TableCellFormat];
    TableCellFormat.requiredContainer = TableBodyFormat;

    TableCellFormat.allowedChildren = [TableCellInnerFormat, Break];
    TableCellFormat.requiredContainer = TableRowFormat;

    TableCellInnerFormat.requiredContainer = TableCellFormat;

    Quill.register({
      'blots/scroll': ScrollOverride,
      'blots/block': BlockOverride,
      [`formats/${blotName.tableCell}`]: TableCellFormat,
      [`formats/${blotName.tableCellInner}`]: TableCellInnerFormat,
      [`formats/${blotName.tableRow}`]: TableRowFormat,
      [`formats/${blotName.tableBody}`]: TableBodyFormat,
      [`formats/${blotName.tableCol}`]: TableColFormat,
      [`formats/${blotName.tableColgroup}`]: TableColgroupFormat,
      [`formats/${blotName.tableMain}`]: TableMainFormat,
      [`formats/${blotName.tableWrapper}`]: TableWrapperFormat,
    }, true);
  }

  quill: Quill;
  options: TableUpOptions;
  fixTableByLisenter = debounce(this.balanceTables, 100);
  resizer: TableResizeLine;
  selector?: HTMLElement;
  picker?: (Picker & { options: HTMLElement });
  range?: Range | null;
  table?: HTMLElement;
  tableSelection?: TableSelection;

  constructor(quill: Quill, options: Partial<TableUpOptions>) {
    this.quill = quill;
    this.options = this.resolveOptions(options || {});

    const toolbar = this.quill.getModule('toolbar') as Toolbar;
    if (toolbar && (this.quill.theme as QuillTheme).pickers) {
      const [, select] = (toolbar.controls as [string, HTMLElement][] || []).find(([name]) => name === TableUp.toolName) || [];
      if (select && select.tagName.toLocaleLowerCase() === 'select') {
        this.picker = (this.quill.theme as QuillTheme).pickers.find(picker => picker.select === select);
        if (this.picker) {
          this.picker.label.innerHTML = icons.table;
          this.buildCustomSelect(this.options.customSelect);
          this.picker.label.addEventListener('mousedown', this.handleInViewport);
        }
      }
    }

    const keyboard = this.quill.getModule('keyboard') as Keyboard;
    for (const handle of Object.values(TableUp.keyboradHandler)) {
      // insert before default key handler
      if (handle.bindInHead) {
        keyboard.bindings[handle.key].unshift(handle);
      }
      else {
        keyboard.addBinding(handle.key, handle);
      }
    }

    this.quill.root.addEventListener(
      'click',
      (evt: MouseEvent) => {
        const path = evt.composedPath() as HTMLElement[];
        if (!path || path.length <= 0) return;

        const tableNode = path.find(node => node.tagName && node.tagName.toUpperCase() === 'TABLE' && node.classList.contains('ql-table'));
        if (tableNode) {
          if (this.table === tableNode) return;
          if (this.table) this.hideTableTools();
          this.showTableTools(tableNode, quill);
        }
        else if (this.table) {
          this.hideTableTools();
        }
      },
      false,
    );
    this.quill.root.addEventListener('scroll', () => {
      this.hideTableTools();
    });
    this.quill.on(Quill.events.EDITOR_CHANGE, (event: string, range: Range, oldRange: Range) => {
      if (event === Quill.events.SELECTION_CHANGE && range) {
        const [startBlot] = this.quill.getLine(range.index);
        const [endBlot] = this.quill.getLine(range.index + range.length);
        let startTableBlot;
        let endTableBlot;
        try {
          startTableBlot = findParentBlot(startBlot!, blotName.tableMain);
        }
        catch {}
        try {
          endTableBlot = findParentBlot(endBlot!, blotName.tableMain);
        }
        catch {}

        // only can select inside table or select all table
        if (startBlot instanceof TableColFormat) {
          return this.quill.setSelection(
            range.index + (oldRange.index > range.index ? -1 : 1),
            range.length + (oldRange.length === range.length ? 0 : oldRange.length > range.length ? -1 : 1),
            Quill.sources.USER,
          );
        }
        else if (endBlot instanceof TableColFormat) {
          return this.quill.setSelection(range.index + 1, range.length + 1, Quill.sources.USER);
        }

        if (range.length > 0) {
          if (startTableBlot && !endTableBlot) {
            this.quill.setSelection(range.index - 1, range.length + 1, Quill.sources.USER);
          }
          else if (endTableBlot && !startTableBlot) {
            this.quill.setSelection(range.index, range.length + 1, Quill.sources.USER);
          }
        }

        // if range is not in table. hide table tools
        if (!startTableBlot || !endTableBlot) {
          this.hideTableTools();
        }
      }
    });
    this.resizer = new TableResizeLine(quill, this.options.resizer || {});

    this.pasteTableHandler();
    this.listenBalanceCells();
  }

  resolveOptions(options: Partial<TableUpOptions>) {
    return Object.assign({
      customBtn: true,
      texts: this.resolveTexts(options.texts || {}),
      full: true,
    } as TableUpOptions, options);
  };

  resolveTexts(options: Partial<TableTextOptions>) {
    return Object.assign({
      customBtnText: 'Custom',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      rowText: 'Row',
      colText: 'Column',
      notPositiveNumberError: 'Please enter a positive integer',
    }, options);
  };

  pasteTableHandler() {
    let tableId = randomId();
    let rowId = randomId();
    let colIds: string[] = [];
    let cellCount = 0;
    let colCount = 0;

    this.quill.clipboard.addMatcher('table', (node, delta) => {
      if (delta.ops.length === 0) return delta;
      let colDelta;

      // paste table have or not col
      let hasCol = false;
      if (delta.ops[0] && typeof delta.ops[0].insert !== 'string') {
        for (let i = 0; i < delta.ops.length; i++) {
          const { insert, attributes } = delta.ops[i];
          if (insert && typeof insert !== 'string' && insert[blotName.tableCol]) {
            hasCol = true;
            break;
          }
          if (attributes && attributes[blotName.tableCellInner]) {
            break;
          }
        }
        hasCol = !!delta.ops[0].insert?.[blotName.tableCol];
      }
      let isFull = this.options.full;
      if (hasCol) {
        isFull = !!(delta.ops[0].insert as Record<string, any>)?.[blotName.tableCol]?.full;
      }

      // computed default col width
      const editorStyle = window.getComputedStyle(this.quill.root);
      const editorPaddingLeft = Number.parseFloat(editorStyle.paddingLeft);
      const editorPaddingRight = Number.parseFloat(editorStyle.paddingRight);
      const editorInnerWidth = Number.parseFloat(editorStyle.width) - editorPaddingLeft - editorPaddingRight;
      const defaultColWidth = isFull
        ? `${Math.max(100 / colIds.length, tableColMinWidthPre)}%`
        : `${Math.max(editorInnerWidth / colIds.length, tableColMinWidthPx)}px`;

      if (!hasCol) {
        colDelta = colIds.reduce((colDelta, id) => {
          colDelta.insert({
            [blotName.tableCol]: {
              colId: id,
              tableId,
              width: defaultColWidth,
              full: isFull,
            },
          });
          return colDelta;
        }, new Delta());
      }
      else {
        for (let i = 0; i < delta.ops.length; i++) {
          const insert = delta.ops[i].insert;
          if (!insert || typeof insert === 'string' || !insert[blotName.tableCol]) {
            if (insert === '\n') {
              delta.ops.splice(i, 1);
            }
            break;
          }
          Object.assign(insert[blotName.tableCol]!, {
            tableId,
            colId: colIds[i],
            full: isFull,
            width: !(insert[blotName.tableCol] as TableColValue).width
              ? defaultColWidth
              : Number.parseFloat((insert[blotName.tableCol] as TableColValue).width) + (isFull ? '%' : 'px'),
          });
        }
      }
      // remove quill origin table format
      for (let i = 0; i < delta.ops.length; i++) {
        const attrs = delta.ops[i].attributes;
        if (attrs && attrs.table) {
          delete attrs.table;
        }
      }
      tableId = randomId();
      colIds = [];
      cellCount = 0;
      colCount = 0;
      delta = colDelta ? colDelta.concat(delta) : delta;
      // insert break line before table and after table
      delta.ops.unshift({ insert: '\n' });
      delta.ops.push({ insert: '\n' });
      return delta;
    });

    this.quill.clipboard.addMatcher('col', (node) => {
      colIds[colCount] = randomId();
      const delta = new Delta().insert({
        [blotName.tableCol]: {
          tableId,
          colId: colIds[colCount],
          full: Object.hasOwn((node as HTMLElement).dataset, 'full'),
        },
      });
      colCount += 1;
      return delta;
    });

    this.quill.clipboard.addMatcher('tr', (node, delta) => {
      rowId = randomId();
      cellCount = 0;
      for (const op of delta.ops) {
        if (
          op.attributes && op.attributes.background
          && op.attributes[blotName.tableCellInner]
          && !(op.attributes[blotName.tableCellInner] as Record<string, any>).backgroundColor
        ) {
          (op.attributes[blotName.tableCellInner] as Record<string, any>).backgroundColor = op.attributes.background;
        }
      }
      return delta;
    });

    const matchCell = (node: Node, delta: TypeDelta) => {
      const cell = node as HTMLElement;
      const rowspan = cell.getAttribute('rowspan') || 1;
      const colspan = cell.getAttribute('colspan') || 1;
      const height = cell.getAttribute('height') || 1;
      const backgroundColor = cell.style.backgroundColor || undefined;
      if (!colIds[cellCount]) {
        for (let i = cellCount; i >= 0; i--) {
          if (!colIds[i]) colIds[i] = randomId();
        }
      }
      const colId = colIds[cellCount];
      cellCount += Number(colspan);

      if (delta.slice(delta.length() - 1).ops[0]?.insert !== '\n') {
        delta.insert('\n');
      }
      // add each insert tableCellInner format
      return delta.compose(
        new Delta().retain(delta.length(), {
          [blotName.tableCellInner]: {
            tableId,
            rowId,
            colId,
            rowspan,
            colspan,
            height,
            backgroundColor,
          },
        }),
      ); ;
    };

    this.quill.clipboard.addMatcher('td', matchCell);
    this.quill.clipboard.addMatcher('th', matchCell);
  }

  showTableTools(table: HTMLElement, quill: Quill) {
    if (table) {
      this.table = table;
      this.tableSelection = new TableSelection(this, table, quill, this.options.selection || {});
    }
  }

  hideTableTools() {
    this.tableSelection && this.tableSelection.destroy();
    this.tableSelection = undefined;
    this.table = undefined;
  }

  async buildCustomSelect(customSelect?: (module: TableUp) => HTMLElement | Promise<HTMLElement>) {
    if (!this.picker) return;
    const dom = document.createElement('div');
    dom.classList.add('ql-custom-select');
    this.selector = customSelect && isFunction(customSelect)
      ? await customSelect(this)
      : createSelectBox({
        onSelect: (row: number, col: number) => {
          this.insertTable(row, col);
          if (this.picker) {
            this.picker.close();
          }
        },
        customBtn: this.options.customBtn,
        texts: this.options.texts,
      });
    dom.appendChild(this.selector);
    this.picker.options.appendChild(dom);
  };

  handleInViewport = () => {
    if (!this.selector || !this.picker) return;
    const selectRect = this.selector.getBoundingClientRect();
    if (selectRect.right >= window.innerWidth) {
      const labelRect = this.picker.label.getBoundingClientRect();
      Object.assign(this.picker.options.style, { transform: `translateX(calc(-100% + ${labelRect.width}px))` });
    }
    else {
      Object.assign(this.picker.options.style, { transform: undefined });
    }
  };

  insertTable(rows: number, columns: number) {
    if (rows >= 30 || columns >= 30) {
      throw new Error('Both rows and columns must be less than 30.');
    }

    this.quill.focus();
    this.range = this.quill.getSelection();
    const range = this.range;
    if (range == null) return;
    const [currentBlot] = this.quill.getLeaf(range.index);
    if (!currentBlot) return;
    if (isForbidInTable(currentBlot)) {
      throw new Error(`Not supported ${currentBlot.statics.blotName} insert into table.`);
    }

    const rootStyle = getComputedStyle(this.quill.root);
    const paddingLeft = Number.parseInt(rootStyle.paddingLeft);
    const paddingRight = Number.parseInt(rootStyle.paddingRight);
    const width = Number.parseInt(rootStyle.width) - paddingLeft - paddingRight;

    let delta = new Delta().retain(range.index).insert('\n');
    const tableId = randomId();
    const colIds = new Array(columns).fill(0).map(() => randomId());

    // insert delta data to create table
    delta = new Array(columns).fill('\n').reduce((memo, text, i) => {
      memo.insert(text, {
        [blotName.tableCol]: {
          width: !this.options.full ? `${Math.floor(width / columns)}px` : `${(1 / columns) * 100}%`,
          tableId,
          colId: colIds[i],
          full: this.options.full,
        },
      });
      return memo;
    }, delta);
    delta = new Array(rows).fill(0).reduce((memo) => {
      const rowId = randomId();
      return new Array(columns).fill('\n').reduce((memo, text, i) => {
        memo.insert(text, {
          [blotName.tableCellInner]: {
            tableId,
            rowId,
            colId: colIds[i],
            rowspan: 1,
            colspan: 1,
          },
        });
        return memo;
      }, memo);
    }, delta);

    this.quill.updateContents(delta, Quill.sources.USER);
    this.quill.setSelection(range.index + columns + columns * rows + 1, Quill.sources.SILENT);
    this.quill.focus();
  }

  // handle unusual delete cell
  fixUnusuaDeletelTable(tableBlot: TableMainFormat) {
    // calculate all cells
    const trBlots = tableBlot.getRows();
    const tableColIds = tableBlot.getColIds();
    if (trBlots.length === 0) {
      return tableBlot.remove();
    }
    if (tableColIds.length === 0) return;
    // append by col
    const cellSpanMap = new Array(trBlots.length).fill(0).map(() => new Array(tableColIds.length).fill(false));
    const tableId = tableBlot.tableId;
    for (const [indexTr, tr] of trBlots.entries()) {
      let indexTd = 0;
      let indexCol = 0;
      const curCellSpan = cellSpanMap[indexTr];
      const tds = tr.descendants(TableCellFormat);
      // loop every row and column
      while (indexCol < tableColIds.length) {
        // skip when rowspan or colspan
        if (curCellSpan[indexCol]) {
          indexCol += 1;
          continue;
        }
        const curTd = tds[indexTd];
        // if colId does not match. insert a new one
        if (!curTd || curTd.colId !== tableColIds[indexCol]) {
          tr.insertBefore(
            createCell(
              this.quill.scroll,
              {
                tableId,
                colId: tableColIds[indexCol],
                rowId: tr.rowId,
              },
            ),
            curTd,
          );
        }
        else {
          if (indexTr + curTd.rowspan - 1 >= trBlots.length) {
            curTd.getCellInner().rowspan = trBlots.length - indexTr;
          }

          const { colspan, rowspan } = curTd;
          // skip next column cell
          if (colspan > 1) {
            for (let c = 1; c < colspan; c++) {
              curCellSpan[indexCol + c] = true;
            }
          }
          // skip next rowspan cell
          if (rowspan > 1) {
            for (let r = indexTr + 1; r < indexTr + rowspan; r++) {
              for (let c = 0; c < colspan; c++) {
                cellSpanMap[r][indexCol + c] = true;
              }
            }
          }
          indexTd += 1;
        }
        indexCol += 1;
      }

      // if td not match all exist td. Indicates that a cell has been inserted
      if (indexTd < tds.length) {
        for (let i = indexTd; i < tds.length; i++) {
          tds[i].remove();
        }
      }
    }
  }

  balanceTables() {
    for (const tableBlot of this.quill.scroll.descendants(TableMainFormat)) {
      this.fixUnusuaDeletelTable(tableBlot);
    }
  }

  listenBalanceCells() {
    this.quill.on(
      Quill.events.SCROLL_OPTIMIZE,
      (mutations: MutationRecord[]) => {
        mutations.some((mutation) => {
          if (
            // TODO: if need add ['COL', 'COLGROUP']
            ['TD', 'TR', 'TBODY', 'TABLE'].includes((mutation.target as HTMLElement).tagName)
          ) {
            this.fixTableByLisenter();
            return true;
          }
          return false;
        });
      },
    );
  }

  setBackgroundColor(selectedTds: TableCellInnerFormat[], color: string) {
    if (selectedTds.length === 0) return;
    for (const td of selectedTds) {
      td.backgroundColor = color;
    }
  }

  deleteTable() {
    if (!this.tableSelection || this.tableSelection.selectedTds.length === 0) return;
    const selectedTds = this.tableSelection.selectedTds;
    const tableBlot = findParentBlot(selectedTds[0], blotName.tableMain);
    tableBlot && tableBlot.remove();
    this.hideTableTools();
  }

  appendRow(isDown: boolean) {
    if (!this.tableSelection) return;
    const selectedTds = this.tableSelection.selectedTds;
    if (selectedTds.length <= 0) return;
    // find baseTd and baseTr
    const baseTd = selectedTds[isDown ? selectedTds.length - 1 : 0];
    const [tableBlot, tableBodyBlot, baseTdParentTr] = findParentBlots(baseTd, [blotName.tableMain, blotName.tableBody, blotName.tableRow] as const);
    const tableTrs = tableBlot.getRows();
    const i = tableTrs.indexOf(baseTdParentTr);
    const insertRowIndex = i + (isDown ? baseTd.rowspan : 0);

    tableBodyBlot.insertRow(insertRowIndex);
  }

  appendCol(isRight: boolean) {
    if (!this.tableSelection) return;
    const selectedTds = this.tableSelection.selectedTds;
    if (selectedTds.length <= 0) return;

    // find insert column index in row
    const [baseTd] = selectedTds.reduce((pre, cur) => {
      const columnIndex = cur.getColumnIndex();
      if (!isRight && columnIndex <= pre[1]) {
        pre = [cur, columnIndex];
      }
      else if (isRight && columnIndex >= pre[1]) {
        pre = [cur, columnIndex];
      }
      return pre;
    }, [selectedTds[0], selectedTds[0].getColumnIndex()]);
    const columnIndex = baseTd.getColumnIndex() + (isRight ? baseTd.colspan : 0);

    const tableBlot = findParentBlot(baseTd, blotName.tableMain);
    const tableId = tableBlot.tableId;
    const newColId = randomId();

    const [colgroup] = tableBlot.descendants(TableColgroupFormat);
    if (colgroup) {
      colgroup.insertColByIndex(columnIndex, {
        tableId,
        colId: newColId,
        width: tableBlot.full ? '6%' : '160px',
        full: tableBlot.full,
      });
    }

    // loop tr and insert cell at index
    // if index is inner cell, skip next `rowspan` line
    // if there are cells both have column span and row span before index cell, minus `colspan` cell for next line
    const trs = tableBlot.getRows();
    const spanCols: number[] = [];
    let skipRowNum = 0;
    for (const tr of Object.values(trs)) {
      const spanCol = spanCols.shift() || 0;
      if (skipRowNum > 0) {
        skipRowNum -= 1;
        continue;
      }
      const nextSpanCols = tr.insertCell(columnIndex - spanCol, {
        tableId,
        rowId: tr.rowId,
        colId: newColId,
        rowspan: 1,
        colspan: 1,
      });
      if (nextSpanCols.skipRowNum) {
        skipRowNum += nextSpanCols.skipRowNum;
      }
      for (const [i, n] of nextSpanCols.entries()) {
        spanCols[i] = (spanCols[i] || 0) + n;
      }
    }
  }

  /**
   * after insert or remove cell. handle cell colspan and rowspan merge
   */
  fixTableByRemove(tableBlot: TableMainFormat) {
    // calculate all cells
    // maybe will get empty tr
    const trBlots = tableBlot.getRows();
    const tableCols = tableBlot.getCols();
    const colIdMap = tableCols.reduce((idMap, col) => {
      idMap[col.colId] = 0;
      return idMap;
    }, {} as Record<string, number>);
    // merge rowspan
    const reverseTrBlots = [...trBlots].reverse();
    const removeTr: number[] = [];
    for (const [index, tr] of reverseTrBlots.entries()) {
      const i = trBlots.length - index - 1;
      if (tr.children.length <= 0) {
        removeTr.push(i);
      }
      else {
        // if have td rowspan across empty tr. minus rowspan
        tr.foreachCellInner((td) => {
          const sum = removeTr.reduce((sum, val) => td.rowspan + i > val ? sum + 1 : sum, 0);
          td.rowspan -= sum;
          // count exist col
          colIdMap[td.colId] += 1;
        });
      }
    }
    // merge colspan
    let index = 0;
    for (const count of Object.values(colIdMap)) {
      if (count === 0) {
        const spanCols: number[] = [];
        let skipRowNum = 0;
        for (const tr of Object.values(trBlots)) {
          const spanCol = spanCols.shift() || 0;
          let nextSpanCols = [];
          if (skipRowNum > 0) {
            nextSpanCols = tr.getCellByColumIndex(index - spanCol)[2];
            skipRowNum -= 1;
          }
          else {
            nextSpanCols = tr.removeCell(index - spanCol);
            if (nextSpanCols.skipRowNum) {
              skipRowNum += nextSpanCols.skipRowNum;
            }
          }
          for (const [i, n] of nextSpanCols.entries()) {
            spanCols[i] = (spanCols[i] || 0) + n;
          }
        }
      }
      else {
        index += 1;
      }
    }
    // remove col
    for (const col of tableCols) {
      if (colIdMap[col.colId] === 0) {
        if (col.prev) {
          (col.prev as TableColFormat).width += col.width;
        }
        else if (col.next) {
          (col.next as TableColFormat).width += col.width;
        }
        col.remove();
      }
    }
  }

  removeRow() {
    if (!this.tableSelection) return;
    const selectedTds = this.tableSelection.selectedTds;
    if (selectedTds.length <= 0) return;
    const baseTd = selectedTds[0];
    const tableBlot = findParentBlot(baseTd, blotName.tableMain);
    const trs = tableBlot.getRows();
    let endTrIndex = trs.length;
    let nextTrIndex = -1;
    for (const td of selectedTds) {
      const tr = findParentBlot(td, blotName.tableRow);
      const index = trs.indexOf(tr);
      if (index < endTrIndex) {
        endTrIndex = index;
      }
      if (index + td.rowspan > nextTrIndex) {
        nextTrIndex = index + td.rowspan;
      }
    }

    const patchTds: {
      [key: string]: {
        rowspan: number;
        colspan: number;
        colIndex: number;
      };
    } = {};
    for (let i = endTrIndex; i < Math.min(trs.length, nextTrIndex); i++) {
      const tr = trs[i];
      tr.foreachCellInner((td) => {
        // find cells in rowspan that exceed the deletion range
        if (td.rowspan + i > nextTrIndex) {
          patchTds[td.colId] = {
            rowspan: td.rowspan + i - nextTrIndex,
            colspan: td.colspan,
            colIndex: td.getColumnIndex(),
          };
        }
        // only remove td. empty tr to calculate colspan and rowspan
        td.parent.remove();
      });
    }

    if (trs[nextTrIndex]) {
      const nextTr = trs[nextTrIndex];
      const tableId = tableBlot.tableId;
      // insert cell in nextTr to patch exceed cell
      for (const [colId, { colIndex, colspan, rowspan }] of Object.entries(patchTds)) {
        nextTr.insertCell(colIndex, {
          tableId,
          rowId: nextTr.rowId,
          colId,
          colspan,
          rowspan,
        });
      }
    }

    this.fixTableByRemove(tableBlot);
  }

  removeCol() {
    if (!this.tableSelection) return;
    const selectedTds = this.tableSelection.selectedTds;
    if (selectedTds.length <= 0) return;
    const baseTd = selectedTds[0];
    const tableBlot = findParentBlot(baseTd, blotName.tableMain);
    const colspanMap: Record<string, number> = {};
    for (const td of selectedTds) {
      if (!colspanMap[td.rowId]) colspanMap[td.rowId] = 0;
      colspanMap[td.rowId] += td.colspan;
    }
    const colspanCount = Math.max(...Object.values(colspanMap));
    const columnIndex = baseTd.getColumnIndex();

    const trs = tableBlot.descendants(TableRowFormat);
    for (let i = 0; i < colspanCount; i++) {
      const spanCols: number[] = [];
      let skipRowNum = 0;
      for (const tr of Object.values(trs)) {
        const spanCol = spanCols.shift() || 0;
        if (skipRowNum > 0) {
          skipRowNum -= 1;
          continue;
        }
        const nextSpanCols = tr.removeCell(columnIndex - spanCol);
        if (nextSpanCols.skipRowNum) {
          skipRowNum += nextSpanCols.skipRowNum;
        }
        for (const [i, n] of nextSpanCols.entries()) {
          spanCols[i] = (spanCols[i] || 0) + n;
        }
      }
    }
    // delete col need after remove cell. remove cell need all column id
    // manual delete col. use fixTableByRemove to delete col will delete extra cells
    const [colgroup] = tableBlot.descendants(TableColgroupFormat);
    if (colgroup) {
      for (let i = 0; i < colspanCount; i++) {
        colgroup.removeColByIndex(columnIndex);
      }
    }

    this.fixTableByRemove(tableBlot);
  }

  mergeCells() {
    if (!this.tableSelection) return;
    const selectedTds = this.tableSelection.selectedTds;
    if (selectedTds.length <= 1) return;
    const counts = selectedTds.reduce(
      (pre, selectTd, index) => {
        // count column span
        const colId = selectTd.colId;
        if (!pre[0][colId]) pre[0][colId] = 0;
        pre[0][colId] += selectTd.rowspan;
        // count row span
        const rowId = selectTd.rowId;
        if (!pre[1][rowId]) pre[1][rowId] = 0;
        pre[1][rowId] += selectTd.colspan;
        // merge select cell
        if (index !== 0) {
          selectTd.moveChildren(pre[2]);
          selectTd.parent.remove();
        }
        return pre;
      },
      [{} as Record<string, number>, {} as Record<string, number>, selectedTds[0]] as const,
    );

    const rowCount = Math.max(...Object.values(counts[0]));
    const colCount = Math.max(...Object.values(counts[1]));
    const baseTd = counts[2];
    baseTd.colspan = colCount;
    baseTd.rowspan = rowCount;

    const tableBlot = findParentBlot(baseTd, blotName.tableMain);
    this.fixTableByRemove(tableBlot);
  }

  splitCell() {
    if (!this.tableSelection) return;
    const selectedTds = this.tableSelection.selectedTds;
    if (selectedTds.length !== 1) return;
    const baseTd = selectedTds[0];
    if (baseTd.colspan === 1 && baseTd.rowspan === 1) return;
    const [tableBlot, baseTr] = findParentBlots(baseTd, [blotName.tableMain, blotName.tableRow] as const);
    const tableId = tableBlot.tableId;
    const colIndex = baseTd.getColumnIndex();
    const colIds = tableBlot.getColIds().slice(colIndex, colIndex + baseTd.colspan).reverse();

    let curTr = baseTr;
    let rowspan = baseTd.rowspan;
    // reset span first. insertCell need colspan to judge insert position
    baseTd.colspan = 1;
    baseTd.rowspan = 1;
    while (curTr && rowspan > 0) {
      for (const id of colIds) {
        // keep baseTd. baseTr should insert at baseTd's column index + 1
        if (curTr === baseTr && id === baseTd.colId) continue;
        curTr.insertCell(colIndex + (curTr === baseTr ? 1 : 0), {
          tableId,
          rowId: curTr.rowId,
          colId: id,
          rowspan: 1,
          colspan: 1,
        });
      }

      rowspan -= 1;
      curTr = curTr.next as TableRowFormat;
    }
  }
}
export default TableUp;
export * from './modules';
export * from './formats';
export * from './utils/types';
export { blotName, findParentBlot, findParentBlots, randomId } from './utils';
