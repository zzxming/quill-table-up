const Quill = window.Quill;
const TableUp = window.TableUp;
Quill.register({ 'modules/table': TableUp }, true);

const quill = new Quill('#editor', {
  theme: 'snow',
  modules: {
    table: {},
  },
});
