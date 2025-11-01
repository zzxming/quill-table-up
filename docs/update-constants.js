import Quill from 'quill';
import TableUp, { defaultCustomSelect, TableAlign, TableMenuContextmenu, TableResizeBox, TableSelection, TableVirtualScrollbar, updateTableConstants } from 'table-up';

// Update table-up constants before module registe
updateTableConstants({
  // All blot name about table
  blotName: {
    container: 'a-container',
    tableWrapper: 'a',
    tableCaption: 'a-caption',
    tableMain: 'a-main',
    tableColgroup: 'a-colgroup',
    tableCol: 'a-col',
    tableHead: 'a-head',
    tableBody: 'a-body',
    tableFoot: 'a-foot',
    tableRow: 'a-row',
    tableCell: 'a-cell',
    tableCellInner: 'a-cell-inner',
  },
  // Table cell size about variable
  tableUpSize: {
    colMinWidthPre: 5,
    colMinWidthPx: 40,
    rowMinHeightPx: 36,
  },
  // Table internal event. You can listen it by `quill.on(tableUpEvent.AFTER_TABLE_RESIZE, callback)`
  tableUpEvent: {
    AFTER_TABLE_RESIZE: 'after-table-resize',
    TABLE_SELECTION_DRAG_START: 'table-selection-drag-start',
    TABLE_SELECTION_DRAG_END: 'table-selection-drag-end',
    TABLE_SELECTION_CHANGE: 'table-selection-change',
    TABLE_SELECTION_DISPLAY_CHANGE: 'table-selection-display-change',
  },
  // Other variable
  tableUpInternal: {
    moduleName: 'table',
  },
});

Quill.register({
  [`modules/${TableUp.moduleName}`]: TableUp,
}, true);

const _quill = new Quill('#editor1', {
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block', 'code'],
      ['link', 'image', 'video', 'formula'],
      [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ direction: 'rtl' }],
      [{ size: ['small', false, 'large', 'huge'] }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ color: [] }, { background: [] }],
      [{ font: [] }],
      [{ align: [] }],
      [{ [TableUp.toolName]: [] }],
      ['clean'],
    ],
    [TableUp.moduleName]: {
      customSelect: defaultCustomSelect,
      modules: [
        { module: TableVirtualScrollbar },
        { module: TableAlign },
        { module: TableResizeBox },
        { module: TableSelection },
        { module: TableMenuContextmenu },
      ],
    },
  },
});
