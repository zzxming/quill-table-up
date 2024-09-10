const Quill = window.Quill;
const TableUp = window.TableUp.default;

Quill.register({
  'modules/tableUp': TableUp,
}, true);

const quill1 = new Quill('#editor1', {
  // debug: 'info',
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'], // toggled buttons
      ['blockquote', 'code-block', 'code'],
      ['link', 'image', 'video', 'formula'],
      [{ header: 1 }, { header: 2 }], // custom button values
      [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
      [{ script: 'sub' }, { script: 'super' }], // superscript/subscript
      [{ indent: '-1' }, { indent: '+1' }], // outdent/indent
      [{ direction: 'rtl' }], // text direction

      [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ color: [] }, { background: [] }], // dropdown with defaults from theme
      [{ font: [] }],
      [{ align: [] }],
      [{ 'table-up-main': [] }],
      ['clean'],
    ],
    tableUp: {
      full: false,
      selection: {
        selectColor: '#f40',
        tableMenu: {
          localstorageKey: 'used-color',
          tipText: true,
          // tipTexts: {
          //   InsertTop: '向上插入一行',
          //   InsertRight: '向右插入一列',
          //   InsertBottom: '向下插入一行',
          //   InsertLeft: '向左插入一列',
          //   MergeCell: '合并单元格',
          //   SplitCell: '拆分单元格',
          //   DeleteRow: '删除当前行',
          //   DeleteColumn: '删除当前列',
          //   DeleteTable: '删除当前表格',
          //   BackgroundColor: '设置背景颜色',
          // },
          contextmenu: true,
        },
      },
      // texts: {
      //   customBtn: '自定义行列数',
      //   confirmText: '确认',
      //   cancelText: '取消',
      //   rowText: '行数',
      //   colText: '列数',
      //   notPositiveNumberError: '请输入正整数',
      // },
    },
  },
});

const quill2 = new Quill('#editor2', {
  // debug: 'info',
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'], // toggled buttons
      ['blockquote', 'code-block', 'code'],
      ['link', 'image', 'video', 'formula'],
      [{ header: 1 }, { header: 2 }], // custom button values
      [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
      [{ script: 'sub' }, { script: 'super' }], // superscript/subscript
      [{ indent: '-1' }, { indent: '+1' }], // outdent/indent
      [{ direction: 'rtl' }], // text direction

      [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ color: [] }, { background: [] }], // dropdown with defaults from theme
      [{ font: [] }],
      [{ align: [] }],
      [{ 'table-up-main': [] }],
      ['clean'],
    ],
    tableUp: {
      full: true,
      selection: {
        selectColor: '#04f',
        tableMenu: {
          localstorageKey: 'used-color',
          tipText: true,
          tipTexts: {
            InsertTop: '向上插入一行',
            InsertRight: '向右插入一列',
            InsertBottom: '向下插入一行',
            InsertLeft: '向左插入一列',
            MergeCell: '合并单元格',
            SplitCell: '拆分单元格',
            DeleteRow: '删除当前行',
            DeleteColumn: '删除当前列',
            DeleteTable: '删除当前表格',
            BackgroundColor: '设置背景颜色',
          },
          contextmenu: false,
        },
      },
      texts: {
        customBtn: '自定义行列数',
        confirmText: '确认',
        cancelText: '取消',
        rowText: '行数',
        colText: '列数',
        notPositiveNumberError: '请输入正整数',
      },
    },
  },
});

const quill = [
  quill1,
  quill2,
];
window.quill = quill;
// eslint-disable-next-line no-undef
const output = [output1, output2];
// eslint-disable-next-line no-undef
for (const [i, btn] of [btn1, btn2].entries()) {
  btn.addEventListener('click', () => {
    const content = quill[i].getContents();
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
