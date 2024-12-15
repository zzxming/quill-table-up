/* eslint-disable no-undef */
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
    selectionOptions: {
      tableMenu: TableMenuContextmenu,
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
    selectionOptions: {
      tableMenu: TableMenuSelect,
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
    selectionOptions: {
      tableMenu: TableMenuContextmenu,
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
    selectionOptions: {
      tableMenu: TableMenuSelect,
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

const output = [
  output1,
  output2,
  output3,
  output4,
];

for (const [i, btn] of [
  btn1,
  btn2,
  btn3,
  btn4,
].entries()) {
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
