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

const wrapper = document.querySelector('.wrapper');

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
  tableMenuTools.ConvertTothead,
  tableMenuTools.ConvertTotfoot,
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
    customSelect: defaultCustomSelect,
    customBtn: true,
    modules: [
      { module: TableVirtualScrollbar },
      { module: TableAlign },
      { module: TableResizeLine },
      { module: TableResizeScale },
      { module: TableSelection },
      {
        module: TableMenuContextmenu,
        options: {
          tools: menuTools,
        },
      },
    ],
  },
  {
    full: false,
    customSelect: defaultCustomSelect,
    customBtn: true,
    modules: [
      { module: TableVirtualScrollbar },
      { module: TableAlign },
      { module: TableResizeBox },
      { module: TableResizeScale },
      { module: TableSelection },
      {
        module: TableMenuSelect,
        options: {
          tools: menuTools,
        },
      },
    ],
  },
  {
    full: true,
    customSelect: defaultCustomSelect,
    customBtn: true,
    modules: [
      { module: TableVirtualScrollbar },
      { module: TableAlign },
      { module: TableResizeLine },
      { module: TableResizeScale },
      { module: TableSelection },
      {
        module: TableMenuSelect,
        options: {
          tools: menuTools,
        },
      },
    ],
  },
  {
    full: true,
    customSelect: defaultCustomSelect,
    customBtn: true,
    modules: [
      { module: TableVirtualScrollbar },
      { module: TableAlign },
      { module: TableResizeBox },
      { module: TableResizeScale },
      { module: TableSelection },
      {
        module: TableMenuContextmenu,
        options: {
          tools: menuTools,
        },
      },
    ],
  },
  {
    full: false,
    customSelect: defaultCustomSelect,
    customBtn: true,
    autoMergeCell: false,
    modules: [
      { module: TableVirtualScrollbar },
      { module: TableAlign },
      { module: TableResizeLine },
      { module: TableResizeScale },
      { module: TableSelection },
      {
        module: TableMenuContextmenu,
        options: {
          tools: menuTools,
        },
      },
    ],
  },
  {
    full: false,
    customSelect: defaultCustomSelect,
    customBtn: true,
    autoMergeCell: false,
    modules: [
      { module: TableVirtualScrollbar },
      { module: TableAlign },
      { module: TableResizeBox },
      { module: TableResizeScale },
      { module: TableSelection },
      {
        module: TableMenuContextmenu,
        options: {
          tools: menuTools,
        },
      },
    ],
  },
].map((ops, i) => {
  const container = document.createElement('div');
  container.id = `container${i + 1}`;
  const btn = document.createElement('button');
  btn.id = `btn${i + 1}`;
  btn.textContent = 'console';
  container.appendChild(btn);
  const editor = document.createElement('div');
  editor.id = `editor${i + 1}`;
  if (i < 4) {
    editor.style.height = '600px';
  }
  if (i === 4) {
    editor.style.padding = '20px';
  }
  container.appendChild(editor);
  const output = document.createElement('div');
  output.id = `output${i + 1}`;
  container.appendChild(output);
  wrapper.appendChild(container);
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
