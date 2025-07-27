const Quill = window.Quill;
const {
  default: TableUp,
  TableAlign,
  TableVirtualScrollbar,
  TableResizeLine,
  TableResizeBox,
  TableMenuContextmenu,
  TableMenuSelect,
  TableResizeScale,
  defaultCustomSelect,
  TableSelection,
  tableMenuTools,
} = window.TableUp;

Quill.register({
  [`modules/${TableUp.moduleName}`]: TableUp,
}, true);

const toolbarConfig = [
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
];
const menuTools = [
  tableMenuTools.ToggleTdBetweenTh,
  tableMenuTools.Break,
  tableMenuTools.InsertCaption,
  tableMenuTools.InsertTop,
  tableMenuTools.InsertRight,
  tableMenuTools.InsertBottom,
  tableMenuTools.InsertLeft,
  tableMenuTools.Break,
  tableMenuTools.MergeCell,
  tableMenuTools.SplitCell,
  tableMenuTools.Break,
  tableMenuTools.DeleteRow,
  tableMenuTools.DeleteColumn,
  tableMenuTools.DeleteTable,
  tableMenuTools.Break,
  tableMenuTools.BackgroundColor,
  tableMenuTools.BorderColor,
  tableMenuTools.Break,
  tableMenuTools.CopyCell,
  tableMenuTools.CutCell,
  tableMenuTools.Break,
  tableMenuTools.SwitchWidth,
];
const quills = [
  {
    full: false,
    scrollbar: TableVirtualScrollbar,
    align: TableAlign,
    resize: TableResizeLine,
    resizeScale: TableResizeScale,
    customSelect: defaultCustomSelect,
    customBtn: true,
    selection: TableSelection,
    selectionOptions: {},
    tableMenu: TableMenuContextmenu,
    tableMenuOptions: {
      tools: menuTools,
    },
  },
  {
    full: false,
    scrollbar: TableVirtualScrollbar,
    align: TableAlign,
    resize: TableResizeBox,
    resizeScale: TableResizeScale,
    customSelect: defaultCustomSelect,
    customBtn: true,
    selection: TableSelection,
    selectionOptions: {},
    tableMenu: TableMenuSelect,
    tableMenuOptions: {
      tools: menuTools,
    },
  },
  {
    full: true,
    scrollbar: TableVirtualScrollbar,
    align: TableAlign,
    resize: TableResizeLine,
    resizeScale: TableResizeScale,
    customSelect: defaultCustomSelect,
    customBtn: true,
    selection: TableSelection,
    selectionOptions: {},
    tableMenu: TableMenuSelect,
    tableMenuOptions: {
      tools: menuTools,
    },
  },
  {
    full: true,
    scrollbar: TableVirtualScrollbar,
    align: TableAlign,
    resize: TableResizeBox,
    resizeScale: TableResizeScale,
    customSelect: defaultCustomSelect,
    customBtn: true,
    selection: TableSelection,
    selectionOptions: {},
    tableMenu: TableMenuContextmenu,
    tableMenuOptions: {
      tools: menuTools,
    },
  },
  {
    full: false,
    scrollbar: TableVirtualScrollbar,
    align: TableAlign,
    resize: TableResizeLine,
    resizeScale: TableResizeScale,
    customSelect: defaultCustomSelect,
    customBtn: true,
    selection: TableSelection,
    selectionOptions: {},
    tableMenu: TableMenuContextmenu,
    tableMenuOptions: {
      tools: menuTools,
    },
  },
].map((ops, i) => {
  return new Quill(`#editor${i + 1}`, {
    // debug: 'info',
    theme: 'snow',
    modules: {
      toolbar: toolbarConfig,
      [TableUp.moduleName]: ops,
    },
  });
});

window.quills = quills;

const output = new Array(quills.length).fill(0).map((_, i) => document.getElementById(`output${i + 1}`));
const btns = new Array(quills.length).fill(0).map((_, i) => document.getElementById(`btn${i + 1}`));
for (const [i, btn] of btns.entries()) {
  btn.addEventListener('click', () => {
    const content = quills[i].getContents();
    console.log(content);
    output[i].innerHTML = '';
    // eslint-disable-next-line unicorn/no-array-for-each
    content.forEach((content) => {
      const item = document.createElement('li');
      item.textContent = `${JSON.stringify(content)},`;
      output[i].appendChild(item);
    });
  });
}
