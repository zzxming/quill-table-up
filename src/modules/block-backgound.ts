import Quill from 'quill';

const Parchment = Quill.import('parchment');
export const BlockBackground = new Parchment.Attributor('block-background-color', 'data-background-color', {
  scope: Parchment.Scope.BLOCK,
});
