/* eslint-disable unused-imports/no-unused-vars */
const Quill = window.Quill;
const TableUp = window.TableUp.default;

Quill.register({
  'modules/tableUp': window.TableUp.TableUpV2,
}, true);

const quill = new Quill('#editor', {
  // debug: 'info',
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'], // toggled buttons
      ['blockquote', 'code-block'],
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
        tipText: true,
      },
      texts: {
        customBtnText: 'Custom',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        rowText: 'Row',
        colText: 'Column',
        notPositiveNumberError: 'Please enter a positive integer',
      },
    },
  },
});

quill.setContents([

  { insert: '\n' },
  { attributes: { 'table-up-col': { tableId: '3f9v65d1jea', colId: 'dm2iv5nk59i', width: '20%', full: true } }, insert: '\n' },
  { attributes: { 'table-up-col': { tableId: '3f9v65d1jea', colId: '110vmas75gg', width: '20%', full: true } }, insert: '\n' },
  { attributes: { 'table-up-col': { tableId: '3f9v65d1jea', colId: 'xngnqidm9qq', width: '20%', full: true } }, insert: '\n' },
  { attributes: { 'table-up-col': { tableId: '3f9v65d1jea', colId: 'uf00txcv6fi', width: '20%', full: true } }, insert: '\n' },
  { attributes: { 'table-up-col': { tableId: '3f9v65d1jea', colId: 'n53lvqhi2p', width: '20%', full: true } }, insert: '\n' },
  { attributes: { 'table-up-cell-inner': { tableId: '3f9v65d1jea', rowId: 'nmyr8vn3828', colId: 'dm2iv5nk59i', rowspan: '3', colspan: '3' } }, insert: '\n\n\n\n\n\n\n\n\n' },
  { attributes: { 'table-up-cell-inner': { tableId: '3f9v65d1jea', rowId: 'nmyr8vn3828', colId: 'uf00txcv6fi', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { 'table-up-cell-inner': { tableId: '3f9v65d1jea', rowId: 'nmyr8vn3828', colId: 'n53lvqhi2p', rowspan: '4', colspan: '1' } }, insert: '\n\n\n\n' },
  { attributes: { 'table-up-cell-inner': { tableId: '3f9v65d1jea', rowId: 'oepb5fr3urk', colId: 'uf00txcv6fi', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { 'table-up-cell-inner': { tableId: '3f9v65d1jea', rowId: 'gt997kxksnc', colId: 'uf00txcv6fi', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { 'table-up-cell-inner': { tableId: '3f9v65d1jea', rowId: 'umw8jbf0ha', colId: 'dm2iv5nk59i', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { 'table-up-cell-inner': { tableId: '3f9v65d1jea', rowId: 'umw8jbf0ha', colId: '110vmas75gg', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { 'table-up-cell-inner': { tableId: '3f9v65d1jea', rowId: 'umw8jbf0ha', colId: 'xngnqidm9qq', rowspan: '2', colspan: '2' } }, insert: '\n\n\n\n' },
  { attributes: { 'table-up-cell-inner': { tableId: '3f9v65d1jea', rowId: 'cvuztwvj1hl', colId: 'dm2iv5nk59i', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { 'table-up-cell-inner': { tableId: '3f9v65d1jea', rowId: 'cvuztwvj1hl', colId: '110vmas75gg', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { 'table-up-cell-inner': { tableId: '3f9v65d1jea', rowId: 'cvuztwvj1hl', colId: 'n53lvqhi2p', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { insert: '\n' },
]);

// eslint-disable-next-line no-undef
btn.addEventListener('click', () => {
  console.log(quill.getContents());
});
