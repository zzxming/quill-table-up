import Quill from 'quill';

const Parchment = Quill.import('parchment');
export const BlockBackground = new Parchment.StyleAttributor('block-background-color', 'background-color', {
  scope: Parchment.Scope.BLOCK,
});
