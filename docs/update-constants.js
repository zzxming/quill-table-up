import Quill from 'quill';
import TableUp, { defaultCustomSelect, TableAlign, TableMenuContextmenu, TableResizeBox, TableSelection, TableVirtualScrollbar, updateTableConstants } from 'table-up';

updateTableConstants({
  blotName: {
    container: 'a-container',
    tableWrapper: 'a',
    tableMain: 'a-main',
    tableColgroup: 'a-colgroup',
    tableCol: 'a-col',
    tableBody: 'a-body',
    tableRow: 'a-row',
    tableCell: 'a-cell',
    tableCellInner: 'a-cell-inner',
  },
  tableUpSize: {
    colMinWidthPre: 5,
    colMinWidthPx: 40,
    rowMinHeightPx: 36,
  },
  tableUpEvent: {
    AFTER_TABLE_RESIZE: 'after-table-resize',
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
      scrollbar: TableVirtualScrollbar,
      align: TableAlign,
      resize: TableResizeBox,
      customSelect: defaultCustomSelect,
      selection: TableSelection,
      selectionOptions: {
        tableMenu: TableMenuContextmenu,
      },
    },
  },
});
