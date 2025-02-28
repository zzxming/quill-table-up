import type { Range, Parchment as TypeParchment } from 'quill';
import type { EmitterSource } from 'quill/core';
import type { Context } from 'quill/modules/keyboard';
import type Keyboard from 'quill/modules/keyboard';
import type Toolbar from 'quill/modules/toolbar';
import type { InternalModule, InternalTableSelectionModule, QuillTheme, QuillThemePicker, TableConstantsData, TableTextOptions, TableUpOptions } from './utils';
import Quill from 'quill';
import { BlockOverride, ContainerFormat, ScrollOverride, TableBodyFormat, TableCellFormat, TableCellInnerFormat, TableColFormat, TableColgroupFormat, TableMainFormat, TableRowFormat, TableWrapperFormat } from './formats';
import { TablePasteParser } from './modules';
import { blotName, createBEM, createSelectBox, debounce, findParentBlot, findParentBlots, isForbidInTable, isFunction, isString, limitDomInViewPort, mixinClass, randomId, tableCantInsert, tableUpEvent, tableUpSize } from './utils';

const Delta = Quill.import('delta');
const Break = Quill.import('blots/break') as TypeParchment.BlotConstructor;
const icons = Quill.import('ui/icons') as Record<string, any>;
const Parchment = Quill.import('parchment');

function createCell(scroll: TypeParchment.ScrollBlot, { tableId, rowId, colId }: { tableId: string; rowId: string; colId: string }) {
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
}
export function updateTableConstants(data: Partial<TableConstantsData>) {
  tableCantInsert.delete(blotName.tableCellInner);

  Object.assign(blotName, data.blotName || {});
  Object.assign(tableUpSize, data.tableUpSize || {});
  Object.assign(tableUpEvent, data.tableUpEvent || {});

  TableUp.toolName = blotName.tableWrapper;
  ContainerFormat.blotName = blotName.container;
  TableWrapperFormat.blotName = blotName.tableWrapper;
  TableMainFormat.blotName = blotName.tableMain;
  TableColgroupFormat.blotName = blotName.tableColgroup;
  TableColFormat.blotName = blotName.tableCol;
  TableBodyFormat.blotName = blotName.tableBody;
  TableRowFormat.blotName = blotName.tableRow;
  TableCellFormat.blotName = blotName.tableCell;
  TableCellInnerFormat.blotName = blotName.tableCellInner;

  tableCantInsert.add(blotName.tableCellInner);
}
export function defaultCustomSelect(tableModule: TableUp, picker: QuillThemePicker) {
  return createSelectBox({
    onSelect: (row: number, col: number) => {
      tableModule.insertTable(row, col);
      if (picker) {
        picker.close();
      }
    },
    customBtn: tableModule.options.customBtn,
    texts: tableModule.options.texts,
  });
}

export class TableUp {
  static moduleName = 'table-up';
  static toolName: string = blotName.tableWrapper;
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
          return false;
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

    const overrides = ['header', 'list', 'blockquote', 'code-block'].reduce((formatMap, format) => {
      const key = `formats/${format}`;
      const blot = Quill.import(key) as any;
      formatMap[key] = class extends mixinClass(blot, [BlockOverride]) {
        static register(): void {}
      };
      return formatMap;
    }, {} as Record<string, Function>);

    Quill.register({
      'blots/scroll': ScrollOverride,
      'blots/block': BlockOverride,
      ...overrides,
      [`blots/${blotName.container}`]: ContainerFormat,
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
  toolBox: HTMLDivElement;
  fixTableByLisenter = debounce(this.balanceTables, 100);
  selector?: HTMLElement;
  table?: HTMLElement;
  tableSelection?: InternalTableSelectionModule;
  tableResize?: InternalModule;
  tableScrollbar?: InternalModule;
  tableAlign?: InternalModule;
  tableResizeScale?: InternalModule;

  get statics(): any {
    return this.constructor;
  }

  constructor(quill: Quill, options: Partial<TableUpOptions>) {
    this.quill = quill;
    this.options = this.resolveOptions(options || {});
    const toolboxBEM = createBEM('toolbox');
    this.toolBox = this.quill.addContainer(toolboxBEM.b());

    const originFormat = quill.format;
    quill.format = function (name: string, value: unknown, source: EmitterSource = Quill.sources.API) {
      const blot = this.scroll.query(name);
      // filter embed blot
      if (!((blot as TypeParchment.BlotConstructor).prototype instanceof Parchment.EmbedBlot)) {
        const tableUpModule = this.getModule(TableUp.moduleName) as TableUp;
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

    if (!this.options.scrollbar) {
      const scrollbarBEM = createBEM('scrollbar');
      this.quill.container.classList.add(scrollbarBEM.bm('origin'));
    }

    if (this.options.selection) {
      this.tableSelection = new this.options.selection(this, this.quill, this.options.selectionOptions);
    }

    const toolbar = this.quill.getModule('toolbar') as Toolbar;
    if (toolbar && (this.quill.theme as QuillTheme).pickers) {
      const [, select] = (toolbar.controls as [string, HTMLElement][] || []).find(([name]) => name === this.statics.toolName) || [];
      if (select && select.tagName.toLocaleLowerCase() === 'select') {
        const picker = (this.quill.theme as QuillTheme).pickers.find(picker => picker.select === select);
        if (picker) {
          picker.label.innerHTML = this.options.icon;
          this.buildCustomSelect(this.options.customSelect, picker);
          picker.label.addEventListener('mousedown', () => {
            if (!this.selector || !picker) return;
            const selectRect = this.selector.getBoundingClientRect();
            const { leftLimited } = limitDomInViewPort(selectRect);
            if (leftLimited) {
              const labelRect = picker.label.getBoundingClientRect();
              Object.assign(picker.options.style, { transform: `translateX(calc(-100% + ${labelRect.width}px))` });
            }
            else {
              Object.assign(picker.options.style, { transform: undefined });
            }
          });
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
          if (this.table === tableNode) {
            this.tableSelection && this.tableSelection.show();
            this.tableAlign && this.tableAlign.update();
            return;
          }
          if (this.table) this.hideTableTools();
          this.showTableTools(tableNode);
        }
        else if (this.table) {
          this.hideTableTools();
        }
      },
      false,
    );
    this.quill.on(tableUpEvent.AFTER_TABLE_RESIZE, () => {
      this.tableSelection && this.tableSelection.updateWithSelectedTds();
    });

    new TablePasteParser(this.quill);
    this.listenBalanceCells();
  }

  addContainer(classes: string | HTMLElement) {
    if (isString(classes)) {
      const el = document.createElement('div');
      for (const classname of classes.split(' ')) {
        el.classList.add(classname);
      }
      this.toolBox.appendChild(el);
      return el;
    }
    else {
      this.toolBox.appendChild(classes);
      return classes;
    }
  }

  resolveOptions(options: Partial<TableUpOptions>): TableUpOptions {
    return Object.assign({
      customBtn: false,
      texts: this.resolveTexts(options.texts || {}),
      full: false,
      fullSwitch: true,
      icon: icons.table,
      selectionOptions: {},
      alignOptions: {},
      scrollbarOptions: {},
      resizeOptions: {},
      resizeScaleOptions: {},
    } as TableUpOptions, options);
  }

  resolveTexts(options: Partial<TableTextOptions>) {
    return Object.assign({
      fullCheckboxText: 'Insert full width table',
      customBtnText: 'Custom',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      rowText: 'Row',
      colText: 'Column',
      notPositiveNumberError: 'Please enter a positive integer',
      custom: 'Custom',
      clear: 'Clear',
      transparent: 'Transparent',
      perWidthInsufficient: 'The percentage width is insufficient. To complete the operation, the table needs to be converted to a fixed width. Do you want to continue?',
      CopyCell: 'Copy cell',
      CutCell: 'Cut cell',
      InsertTop: 'Insert row above',
      InsertRight: 'Insert column right',
      InsertBottom: 'Insert row below',
      InsertLeft: 'Insert column Left',
      MergeCell: 'Merge Cell',
      SplitCell: 'Split Cell',
      DeleteRow: 'Delete Row',
      DeleteColumn: 'Delete Column',
      DeleteTable: 'Delete table',
      BackgroundColor: 'Set background color',
      BorderColor: 'Set border color',
    }, options);
  }

  showTableTools(table: HTMLElement) {
    if (table) {
      this.table = table;
      this.tableSelection?.show();
      if (this.options.align) {
        this.tableAlign = new this.options.align(this, table, this.quill, this.options.alignOptions);
      }
      if (this.options.scrollbar) {
        this.tableScrollbar = new this.options.scrollbar(this, table, this.quill, this.options.scrollbarOptions);
      }
      if (this.options.resize) {
        this.tableResize = new this.options.resize(this, table, this.quill, this.options.resizeOptions);
      }
      if (this.options.resizeScale) {
        this.tableResizeScale = new this.options.resizeScale(this, table, this.quill, this.options.resizeScaleOptions);
      }
    }
  }

  hideTableTools() {
    this.tableSelection?.hide();
    if (this.tableScrollbar) {
      this.tableScrollbar.destroy();
      this.tableScrollbar = undefined;
    }
    if (this.tableAlign) {
      this.tableAlign.destroy();
      this.tableAlign = undefined;
    }
    if (this.tableResize) {
      this.tableResize.destroy();
      this.tableResize = undefined;
    }
    if (this.tableResizeScale) {
      this.tableResizeScale.destroy();
    }
    this.table = undefined;
  }

  async buildCustomSelect(customSelect: ((module: TableUp, picker: QuillThemePicker) => HTMLElement | Promise<HTMLElement>) | undefined, picker: QuillThemePicker) {
    if (!customSelect || !isFunction(customSelect)) return;
    const dom = document.createElement('div');
    dom.classList.add('ql-custom-select');
    this.selector = await customSelect(this, picker);
    dom.appendChild(this.selector);
    if (this.options.fullSwitch) {
      const bem = createBEM('creator');
      const isFulllLabel = document.createElement('label');
      isFulllLabel.classList.add(bem.be('checkbox'));
      const isFullCheckbox = document.createElement('input');
      isFullCheckbox.type = 'checkbox';
      isFullCheckbox.checked = this.options.full;
      isFullCheckbox.addEventListener('change', () => {
        this.options.full = isFullCheckbox.checked;
      });
      const isFullCheckboxText = document.createElement('span');
      isFullCheckboxText.textContent = this.options.texts.fullCheckboxText;
      isFulllLabel.appendChild(isFullCheckbox);
      isFulllLabel.appendChild(isFullCheckboxText);
      dom.appendChild(isFulllLabel);
    }
    picker.options.innerHTML = '';
    picker.options.appendChild(dom);
  }

  setCellAttrs(selectedTds: TableCellInnerFormat[], attr: string, value?: any, isStyle: boolean = false) {
    if (selectedTds.length === 0) return;
    for (const td of selectedTds) {
      td.setFormatValue(attr, value, isStyle);
    }
  }

  getTextByCell(tds: TableCellInnerFormat[]) {
    let text = '';
    for (const td of tds) {
      const index = td.offset(this.quill.scroll);
      const length = td.length();
      for (const op of this.quill.getContents(index, length).ops) {
        if (isString(op.insert)) {
          text += op.insert;
        }
      }
    }
    return text;
  }

  getHTMLByCell(tds: TableCellInnerFormat[], isCut = false) {
    if (tds.length === 0) return '';
    let tableMain: TableMainFormat | null = null;
    try {
      for (const td of tds) {
        const tdParentMain = findParentBlot(td, blotName.tableMain);
        if (!tableMain) {
          tableMain = tdParentMain;
        }
        if (tdParentMain !== tableMain) {
          console.error('tableMain is not same');
          return '';
        }
      }
    }
    catch {
      console.error('tds must be in same tableMain');
      return '';
    }

    const colgroupBlot = tableMain!.children.head;
    const tbodyBlot = tableMain!.children.tail;
    if (!tbodyBlot || !colgroupBlot) {
      console.error('tableMain has no tbody or colgroup');
      return '';
    }

    function getElementTags(element: HTMLElement) {
      const tagName = element.tagName.toLowerCase();
      const attributes = Array.from(element.attributes)
        .map(attr => `${attr.name}="${attr.value}"`)
        .join(' ');
      const startTag = `<${tagName}${attributes ? ` ${attributes}` : ''}>`;
      const selfClosingTags = [
        'area',
        'base',
        'br',
        'col',
        'embed',
        'hr',
        'img',
        'input',
        'link',
        'meta',
        'param',
        'source',
        'track',
        'wbr',
      ];

      return {
        startTag,
        endTag: selfClosingTags.includes(tagName) ? '' : `</${tagName}>`,
      };
    }

    let html = '';
    const colIds: Set<string> = new Set();
    let trBlot: ContainerFormat | null = null;
    let tdRows = 0;
    for (const td of tds) {
      if (!trBlot || trBlot !== td.parent.parent) {
        if (trBlot) {
          const { endTag } = getElementTags(trBlot.domNode);
          if (html !== '') html += endTag;
        }
        tdRows += 1;
        trBlot = td.parent.parent as ContainerFormat;
        const { startTag } = getElementTags(trBlot.domNode);
        html = `${html}${startTag}`;
      }
      html += td.parent.domNode.outerHTML;
      colIds.add(td.colId);
    }
    const lastTagName = trBlot ? trBlot.domNode.tagName.toLocaleLowerCase() : '';
    html += `</${lastTagName}>`;

    const { startTag, endTag } = getElementTags(tbodyBlot.domNode as HTMLElement);
    html = `${startTag}${html}${endTag}`;

    const cols = tableMain!.getCols();
    const { startTag: colgroupStartTag, endTag: colgroupEndTag } = getElementTags(colgroupBlot.domNode as HTMLElement);
    let colStr = '';
    let width = 0;
    let isFull = false;
    for (const col of cols.filter(col => colIds.has(col.colId))) {
      const { startTag } = getElementTags(col.domNode as HTMLElement);
      colStr += startTag;
      width += col.width;
      isFull &&= col.full;
    }
    html = colgroupStartTag + colStr + colgroupEndTag + html;

    const tableMainDom = tableMain!.domNode.cloneNode() as HTMLElement;
    tableMainDom.style.width = `${width}${isFull ? '%' : 'px'}`;

    const { startTag: mainStartTag, endTag: mainEndTag } = getElementTags(tableMainDom);
    html = mainStartTag + html + mainEndTag;

    const { startTag: wrapperStartTag, endTag: wrapperEndTag } = getElementTags(tableMain!.parent.domNode as HTMLElement);
    html = wrapperStartTag + html + wrapperEndTag;

    if (isCut) {
      const trs = tableMain!.getRows();
      if (tdRows === trs.length) {
        this.removeCol(tds);
      }
      else {
        for (const td of tds) {
          td.domNode.innerHTML = '<p><br></p>';
        }
      }
    }
    return html;
  }

  insertTable(rows: number, columns: number) {
    if (rows >= 30 || columns >= 30) {
      throw new Error('Both rows and columns must be less than 30.');
    }

    this.quill.focus();
    const range = this.quill.getSelection();
    if (range == null) return;
    const [currentBlot] = this.quill.getLeaf(range.index);
    if (!currentBlot) return;
    if (isForbidInTable(currentBlot)) {
      throw new Error(`Not supported ${currentBlot.statics.blotName} insert into table.`);
    }

    const borderWidth = this.calculateTableCellBorderWidth();
    const rootStyle = getComputedStyle(this.quill.root);
    const paddingLeft = Number.parseInt(rootStyle.paddingLeft);
    const paddingRight = Number.parseInt(rootStyle.paddingRight);
    const width = Number.parseInt(rootStyle.width) - paddingLeft - paddingRight - borderWidth;

    const tableId = randomId();
    const colIds = new Array(columns).fill(0).map(() => randomId());

    // insert delta data to create table
    const colWidth = !this.options.full ? `${Math.max(Math.floor(width / columns), tableUpSize.colMinWidthPx)}px` : `${Math.max((1 / columns) * 100, tableUpSize.colMinWidthPre)}%`;
    const delta: Record<string, any>[] = [
      { retain: range.index },
      { insert: '\n' },
    ];

    for (let i = 0; i < columns; i++) {
      delta.push({
        insert: {
          [blotName.tableCol]: {
            width: colWidth,
            tableId,
            colId: colIds[i],
            full: this.options.full,
          },
        },
      });
    }
    for (let j = 0; j < rows; j++) {
      const rowId = randomId();
      for (let i = 0; i < columns; i++) {
        delta.push({
          insert: '\n',
          attributes: {
            [blotName.tableCellInner]: {
              tableId,
              rowId,
              colId: colIds[i],
              rowspan: 1,
              colspan: 1,
            },
          },
        });
      }
    }

    this.quill.updateContents(new Delta(delta), Quill.sources.USER);
    this.quill.setSelection(range.index + columns + columns * rows + 1, Quill.sources.SILENT);
    this.quill.focus();
  }

  calculateTableCellBorderWidth() {
    const tableStr = `
      <table class="${TableMainFormat.className}">
        <tbody>
          <tr>
            <td class="${TableCellFormat.className}"></td>
          </tr>
        </tbody>
      </table>
    `;
    const div = document.createElement('div');
    div.className = TableWrapperFormat.className;
    div.innerHTML = tableStr;
    div.style.position = 'absolute';
    div.style.left = '-9999px';
    div.style.top = '-9999px';
    div.style.visibility = 'hidden';
    this.quill.root.appendChild(div);
    const tempTableStyle = window.getComputedStyle(div.querySelector('td')!);
    const borderWidth = Number.parseFloat(tempTableStyle.borderWidth) || 0;
    this.quill.root.removeChild(div);
    return borderWidth;
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

  deleteTable(selectedTds: TableCellInnerFormat[]) {
    if (selectedTds.length === 0) return;
    const tableBlot = findParentBlot(selectedTds[0], blotName.tableMain);
    tableBlot && tableBlot.remove();
    this.hideTableTools();
  }

  appendRow(selectedTds: TableCellInnerFormat[], isDown: boolean) {
    if (selectedTds.length <= 0) return;
    // find baseTd and baseTr
    const baseTd = selectedTds[isDown ? selectedTds.length - 1 : 0];
    const [tableBlot, tableBodyBlot, baseTdParentTr] = findParentBlots(baseTd, [blotName.tableMain, blotName.tableBody, blotName.tableRow] as const);
    const tableTrs = tableBlot.getRows();
    const i = tableTrs.indexOf(baseTdParentTr);
    const insertRowIndex = i + (isDown ? baseTd.rowspan : 0);

    tableBodyBlot.insertRow(insertRowIndex);
  }

  appendCol(selectedTds: TableCellInnerFormat[], isRight: boolean) {
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

  removeRow(selectedTds: TableCellInnerFormat[]) {
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

  removeCol(selectedTds: TableCellInnerFormat[]) {
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

  mergeCells(selectedTds: TableCellInnerFormat[]) {
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

  splitCell(selectedTds: TableCellInnerFormat[]) {
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
