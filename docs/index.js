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

quill1.setContents([
  // { insert: '\n' },
  // { insert: { 'table-up-col': { tableId: '1', colId: '1', width: 121 } } },
  // { insert: { 'table-up-col': { tableId: '1', colId: '2', width: 121 } } },
  // { insert: { 'table-up-col': { tableId: '1', colId: '3', width: 121 } } },
  // { insert: '1' },
  // { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { insert: '2' },
  // { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { insert: '3' },
  // { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { insert: '4' },
  // { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { insert: '5' },
  // { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { insert: '6' },
  // { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { insert: '7' },
  // { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { insert: '8' },
  // { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { insert: '9' },
  // { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { insert: '\n' },

  // { insert: '\n' },
  // { insert: { 'table-up-col': { tableId: '6u4kuytbzzh', colId: 'pedy04522cn', width: 20, full: 'true' } } },
  // { insert: { 'table-up-col': { tableId: '6u4kuytbzzh', colId: 'bldcnewj21s', width: 20, full: 'true' } } },
  // { insert: { 'table-up-col': { tableId: '6u4kuytbzzh', colId: 'zyrflypnouc', width: 20, full: 'true' } } },
  // { insert: { 'table-up-col': { tableId: '6u4kuytbzzh', colId: 'm6tip1nl28s', width: 20, full: 'true' } } },
  // { insert: { 'table-up-col': { tableId: '6u4kuytbzzh', colId: 'd05r661z0vp', width: 20, full: 'true' } } },
  // { attributes: { 'table-up-cell-inner': { tableId: '6u4kuytbzzh', rowId: '7k6lukrlm8b', colId: 'pedy04522cn', rowspan: 3, colspan: 3 } }, insert: '\n\n\n\n\n\n\n\n\n' },
  // { attributes: { 'table-up-cell-inner': { tableId: '6u4kuytbzzh', rowId: '7k6lukrlm8b', colId: 'm6tip1nl28s', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { attributes: { 'table-up-cell-inner': { tableId: '6u4kuytbzzh', rowId: '7k6lukrlm8b', colId: 'd05r661z0vp', rowspan: 4, colspan: 1 } }, insert: '\n\n\n\n' },
  // { attributes: { 'table-up-cell-inner': { tableId: '6u4kuytbzzh', rowId: 'n9whqu82whh', colId: 'm6tip1nl28s', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { attributes: { 'table-up-cell-inner': { tableId: '6u4kuytbzzh', rowId: 'wpuv02ej5e9', colId: 'm6tip1nl28s', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { attributes: { 'table-up-cell-inner': { tableId: '6u4kuytbzzh', rowId: '1mqppxcm5mg', colId: 'pedy04522cn', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { attributes: { 'table-up-cell-inner': { tableId: '6u4kuytbzzh', rowId: '1mqppxcm5mg', colId: 'bldcnewj21s', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { attributes: { 'table-up-cell-inner': { tableId: '6u4kuytbzzh', rowId: '1mqppxcm5mg', colId: 'zyrflypnouc', rowspan: 2, colspan: 2 } }, insert: '\n\n\n\n' },
  // { attributes: { 'table-up-cell-inner': { tableId: '6u4kuytbzzh', rowId: 'fnpvihdz0a9', colId: 'pedy04522cn', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { attributes: { 'table-up-cell-inner': { tableId: '6u4kuytbzzh', rowId: 'fnpvihdz0a9', colId: 'bldcnewj21s', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { attributes: { 'table-up-cell-inner': { tableId: '6u4kuytbzzh', rowId: 'fnpvihdz0a9', colId: 'd05r661z0vp', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { insert: '\n' },

  // { insert: '\n' },
  // { insert: { 'table-up-col': { tableId: '1', colId: '1', full: 'true', width: 100 } } },
  // { insert: { video: 'https://quilljs.com/' } },
  // { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { insert: '\n' },
  // { insert: '\n' },
  // { insert: { 'table-up-col': { tableId: '7oymehdtx0k', colId: 'hr7qo4t2dus', full: 'true', width: 100 } } },
  // { insert: { image: 'https://upload-bbs.miyoushe.com/upload/2024/06/18/5556092/73b7bae28fded7a72d93a35d5559b24c_3979852353547906724.png' } },
  // { attributes: { 'table-up-cell-inner': { tableId: '7oymehdtx0k', rowId: '69gog08ow04', colId: 'hr7qo4t2dus', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { insert: '\n' },
  // { insert: '\n' },
  // { insert: { 'table-up-col': { tableId: 'dcxkjqqrkyh', colId: 'xaaktiszroa', width: 100, full: true } } },
  // { attributes: { background: '#ff9900' }, insert: 'qgwqgwqg' },
  // { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: 'dcxkjqqrkyh', rowId: 'rjs4sxwojek', colId: 'xaaktiszroa', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { insert: '\n' },
  // { insert: '\n' },
  // { insert: { 'table-up-col': { tableId: 'jryr10aez6k', colId: 'bpyaloa444v', width: 100, full: true } } },
  // { insert: 'qwgqwg' },
  // { attributes: { 'header': 2, 'table-up-cell-inner': { tableId: 'jryr10aez6k', rowId: 'b0wlvrbwf4w', colId: 'bpyaloa444v', rowspan: 1, colspan: 1, backgroundColor: 'rgb(171, 7, 7)' } }, insert: '\n' },
  // { insert: '\n' },
  // { insert: '\n' },
  // { insert: { 'table-up-col': { tableId: 'smdc7riuiq', colId: 'ljhhnqjnbz', width: 100, full: true } } },
  // { insert: '123' },
  // { attributes: { 'code-block': 'plain', 'table-up-cell-inner': { tableId: 'smdc7riuiq', rowId: 'l2oxrb0yet', colId: 'ljhhnqjnbz', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { insert: 'code' },
  // { attributes: { 'code-block': 'plain', 'table-up-cell-inner': { tableId: 'smdc7riuiq', rowId: 'l2oxrb0yet', colId: 'ljhhnqjnbz', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { insert: '\n' },

  { insert: '\n' },
  { insert: { 'table-up-col': { tableId: '1', colId: '1', width: 25, full: 'true' } } },
  { insert: { 'table-up-col': { tableId: '1', colId: '2', width: 25, full: 'true' } } },
  { insert: { 'table-up-col': { tableId: '1', colId: '3', width: 25, full: 'true' } } },
  { insert: { 'table-up-col': { tableId: '1', colId: '4', width: 25, full: 'true' } } },
  { insert: '1' },
  { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
  { insert: '2' },
  { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
  { insert: '3' },
  { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
  { insert: '4' },
  { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '1', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
  { insert: '5' },
  { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
  { insert: '6' },
  { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
  { insert: '7' },
  { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
  { insert: '8' },
  { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '2', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
  { insert: '9' },
  { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
  { insert: '0' },
  { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
  { insert: '11' },
  { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
  { insert: '12' },
  { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '3', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
  { insert: '13' },
  { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '1', rowspan: 1, colspan: 1 } }, insert: '\n' },
  { insert: '14' },
  { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '2', rowspan: 1, colspan: 1 } }, insert: '\n' },
  { insert: '15' },
  { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '3', rowspan: 1, colspan: 1 } }, insert: '\n' },
  { insert: '16' },
  { attributes: { 'table-up-cell-inner': { tableId: '1', rowId: '4', colId: '4', rowspan: 1, colspan: 1 } }, insert: '\n' },
  { insert: '\n' },

  // { insert: '\n' },
  // { insert: { 'table-up-col': { tableId: 'izqc1radnr', colId: 'bp8dovfq0tp', width: 115 } } },
  // { insert: { 'table-up-col': { tableId: 'izqc1radnr', colId: 'bpqp6e4pctf', width: 115 } } },
  // { insert: { 'table-up-col': { tableId: 'izqc1radnr', colId: 'dycqzdsuyyk', width: 115 } } },
  // { insert: 'qwg' },
  // { attributes: { 'header': 2, 'table-up-cell-inner': { tableId: 'izqc1radnr', rowId: '2hg8za6dno5', colId: 'bp8dovfq0tp', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { insert: 'qwg' },
  // { attributes: { 'header': 2, 'table-up-cell-inner': { tableId: 'izqc1radnr', rowId: '2hg8za6dno5', colId: 'bp8dovfq0tp', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { insert: 'qwg' },
  // { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: 'izqc1radnr', rowId: '2hg8za6dno5', colId: 'bpqp6e4pctf', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { insert: 'qwg' },
  // { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: 'izqc1radnr', rowId: '2hg8za6dno5', colId: 'bpqp6e4pctf', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { insert: 'wgq' },
  // { attributes: { 'list': 'bullet', 'table-up-cell-inner': { tableId: 'izqc1radnr', rowId: '2hg8za6dno5', colId: 'bpqp6e4pctf', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { attributes: { 'table-up-cell-inner': { tableId: 'izqc1radnr', rowId: '2hg8za6dno5', colId: 'dycqzdsuyyk', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { insert: 'qwgqwg' },
  // { attributes: { 'code-block': 'plain', 'table-up-cell-inner': { tableId: 'izqc1radnr', rowId: 'pjzxcc6clq', colId: 'bp8dovfq0tp', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { insert: 'qwg' },
  // { attributes: { 'code-block': 'plain', 'table-up-cell-inner': { tableId: 'izqc1radnr', rowId: 'pjzxcc6clq', colId: 'bp8dovfq0tp', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { attributes: { 'table-up-cell-inner': { tableId: 'izqc1radnr', rowId: 'pjzxcc6clq', colId: 'bpqp6e4pctf', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { attributes: { 'table-up-cell-inner': { tableId: 'izqc1radnr', rowId: 'pjzxcc6clq', colId: 'dycqzdsuyyk', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { attributes: { 'table-up-cell-inner': { tableId: 'izqc1radnr', rowId: 'h7kh7qu6s', colId: 'bp8dovfq0tp', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { attributes: { 'table-up-cell-inner': { tableId: 'izqc1radnr', rowId: 'h7kh7qu6s', colId: 'bpqp6e4pctf', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { attributes: { 'table-up-cell-inner': { tableId: 'izqc1radnr', rowId: 'h7kh7qu6s', colId: 'dycqzdsuyyk', rowspan: 1, colspan: 1 } }, insert: '\n' },
  // { insert: '\n' },
]);

quill1.on('editor-change', (name, range, oldRange) => {
  if (name === 'selection-change' && range) {
    console.log(range);
    console.log(quill1.getLine(range.index)[0].domNode);
  }
  // console.log(quill.getLine(range.index + range.length)[0].domNode);
  if (name === Quill.events.TEXT_CHANGE) {
    console.log(range, oldRange);
    console.log(quill1.history.stack);
  }
});
