const Quill = window.Quill;
const TableUp = window.TableUp.default;
Quill.register({ 'modules/tableUp': TableUp }, true);

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
      [{ table: [] }],
      ['clean'],
    ],
    tableUp: {
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

// eslint-disable-next-line no-undef
btn.addEventListener('click', () => {
  console.log(quill.getContents());
});
