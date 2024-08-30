// import Quill from 'quill';
// import type { Delta as TypeDelta } from 'quill/core';
// import type { Parchment as TypeParchment } from 'quill';
// import { BlockBackground, TableSelection } from './modules';
// import type { AnyClass, TableUpOptions } from './utils';
// import { blotName, createSelectBox, isFunction } from './utils';
// import { TableCellFormat, TableCellInnerFormat } from './formats';

// const Delta = Quill.import('delta');
// const icons = Quill.import('ui/icons') as Record<string, any>;
// const TableModule = Quill.import('modules/table') as AnyClass & { register: () => void };
// const toolName = 'table';
// const TableCell = Quill.import('formats/table') as AnyClass;

// class TableCellWithBackground extends TableCell {
//   format(name: string, value: string) {
//     if (name === BlockBackground.attrName) {
//       this.domNode.style.backgroundColor = value;
//     }
//     return super.format(name, value);
//   }

//   formats() {
//     const formats = super.formats();
//     if (formats[BlockBackground.attrName]) {
//       delete formats.background;
//     }
//     return formats;
//   }
// }

// export default class TableUp extends TableModule {
//   static register() {
//     super.register();
//     Quill.register({
//       'formats/block-background-color': BlockBackground,
//       'formats/table': TableCellWithBackground,
//     }, true);
//   }

//   constructor(quill: Quill, options: TableUpOptions) {
//     super(quill, options);
//     this.options = this.resolveOptions(options || {});

//     const toolbar = this.quill.getModule('toolbar');
//     const [, select] = (toolbar.controls as [string, HTMLElement][] || []).find(([name]) => name === toolName) || [];
//     if (select && select.tagName.toLocaleLowerCase() === 'select') {
//       this.picker = this.quill.theme.pickers.find((picker: any) => picker.select === select);
//       if (!this.picker) return;
//       this.picker.label.innerHTML = icons.table;
//       this.buildCustomSelect(this.options.customSelect);
//       this.picker.label.addEventListener('mousedown', this.handleInViewport);
//     }

//     this.selection = new TableSelection(this, this.quill, this.options.selection);

//     this.tdBackgroundPasteHandle();
//   }

//   tdBackgroundPasteHandle = () => {
//     const clipboard = this.quill.getModule('clipboard');
//     clipboard.addMatcher(Node.ELEMENT_NODE, (node: HTMLElement, delta: TypeDelta) => {
//       if (['td', 'th'].includes(node.tagName.toLocaleLowerCase())) {
//         const backgroundColor = node.style.backgroundColor;
//         if (backgroundColor) {
//           return delta.compose(new Delta().retain(delta.length(), { background: null, [BlockBackground.attrName]: backgroundColor }));
//         }
//       }
//       return delta;
//     });
//   };

//   handleInViewport = () => {
//     const selectRect = this.selector.getBoundingClientRect();
//     if (selectRect.right >= window.innerWidth) {
//       const labelRect = this.picker.label.getBoundingClientRect();
//       this.picker.options.style.transform = `translateX(calc(-100% + ${labelRect.width}px))`;
//     }
//     else {
//       this.picker.options.style.transform = undefined;
//     }
//   };

//   resolveOptions = (options: Record<string, any>) => {
//     return Object.assign({
//       isCustom: true,
//       texts: this.resolveTexts(options.texts || {}),
//       selection: {},
//     }, options);
//   };

//   resolveTexts = (options: Record<string, string>) => {
//     return Object.assign({
//       customBtn: '自定义行列数',
//       confirmText: '确认',
//       cancelText: '取消',
//       rowText: '行数',
//       colText: '列数',
//       notPositiveNumberError: '请输入正整数',
//     }, options);
//   };

//   buildCustomSelect = async (customSelect: HTMLElement) => {
//     const dom = document.createElement('div');
//     dom.classList.add('ql-custom-select');
//     this.selector = customSelect && isFunction(customSelect) ? await customSelect(this) : this.createSelect();
//     dom.appendChild(this.selector);
//     this.picker.options.appendChild(dom);
//   };

//   createSelect = () => {
//     return createSelectBox({
//       onSelect: (row: number, col: number) => {
//         this.insertTable(row, col);
//         this.picker.close();
//       },
//       isCustom: this.options.isCustom,
//       texts: this.options.texts,
//     });
//   };

//   setBackgroundColor = (color: string) => {
//     const range = this.quill.getSelection(true);
//     if (!range) return;
//     const cell = this.getTable(range)[2];
//     if (cell === null) return;
//     cell.format(BlockBackground.attrName, color);
//   };

//   insertTable = (rows: number, columns: number) => {
//     this.quill.focus();
//     super.insertTable(rows, columns);
//   };
// }

import Quill from 'quill';
import type { Range, Parchment as TypeParchment } from 'quill';
import type Picker from 'quill/ui/picker';
import { blotName, createSelectBox, debounce, isFunction, randomId } from './utils';
import { TableBodyFormat, TableCellFormat, TableCellInnerFormat, TableColFormat, TableColgroupFormat, TableMainFormat, TableRowFormat, TableWrapperFormat } from './formats';

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
export const tableCantInsert = [blotName.tableCell, 'code-block'];
export const isForbidInTableBlot = (blot: TypeParchment.Blot) => tableCantInsert.includes(blot.statics.blotName);
export const isForbidInTable = (current: TypeParchment.Blot): boolean =>
  current && current.parent
    ? isForbidInTableBlot(current.parent)
      ? true
      : isForbidInTable(current.parent)
    : false;

type QuillPicker = Picker & { options: HTMLElement };
const tabbleToolName = 'table-up-main';
export class TableUpV2 {
  quill: Quill;
  options: Record<string, any>;
  fixTableByLisenter = debounce(this.balanceTables, 100);
  picker?: QuillPicker;
  selector?: HTMLElement;
  range?: Range | null;

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
      [`formats/${blotName.tableCell}`]: TableCellFormat,
      [`formats/${blotName.tableCellInner}`]: TableCellInnerFormat,
      [`formats/${blotName.tableRow}`]: TableRowFormat,
      [`formats/${blotName.tableBody}`]: TableBodyFormat,
      [`formats/${blotName.tableCol}`]: TableColFormat,
      [`formats/${blotName.tableColGroup}`]: TableColgroupFormat,
      [`formats/${blotName.tableMain}`]: TableMainFormat,
      [`formats/${blotName.tableWrapper}`]: TableWrapperFormat,
    }, true);
  }

  constructor(quill: Quill, options: Record<string, any>) {
    this.quill = quill;
    this.options = options;

    const toolbar = this.quill.getModule('toolbar') as any;
    const [, select] = (toolbar.controls as [string, HTMLElement][] || []).find(([name]) => name === tabbleToolName) || [];
    if (select && select.tagName.toLocaleLowerCase() === 'select') {
      this.picker = (this.quill.theme as unknown as { pickers: QuillPicker[] }).pickers.find(picker => picker.select === select);
      if (!this.picker) return;
      this.picker.label.innerHTML = icons.table;
      this.buildCustomSelect(this.options.customSelect);
      this.picker.label.addEventListener('mousedown', this.handleInViewport);
    }

    this.listenBalanceCells();
  }

  resolveOptions = (options: Record<string, any>) => {
    return Object.assign({
      customable: true,
      texts: this.resolveTexts(options.texts || {}),
      selection: {},
      customSelect: false,
    }, options);
  };

  resolveTexts = (options: Record<string, string>) => {
    return Object.assign({
      customBtn: '自定义行列数',
      confirmText: '确认',
      cancelText: '取消',
      rowText: '行数',
      colText: '列数',
      notPositiveNumberError: '请输入正整数',
    }, options);
  };

  buildCustomSelect = async (customSelect: (module: TableUpV2) => HTMLElement | Promise<HTMLElement>) => {
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
        isCustom: this.options.isCustom,
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
      throw new Error(`Not supported nesting of ${currentBlot.statics.blotName} type object within a table.`);
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
          width: !this.options.fullWidth ? `${Math.floor(width / columns)}px` : `${(1 / columns) * 100}%`,
          tableId,
          colId: colIds[i],
          full: this.options.fullWidth,
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
    console.log(delta);

    this.quill.updateContents(delta, Quill.sources.USER);
    this.quill.setSelection(range.index + columns + columns * rows + 1, Quill.sources.SILENT);
    this.quill.focus();

    // this.closeSelecte();
  }

  // handle unusual delete cell
  fixUnusuaDeletelTable(tableBlot: TableMainFormat) {
    // calculate all cells
    const trBlots = tableBlot.getRows();
    const tableColIds = tableBlot.getColIds();
    if (trBlots.length === 0 || tableColIds.length === 0) {
      return tableBlot.remove();
    }
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
}

// export * from './modules';
export * from './formats';
