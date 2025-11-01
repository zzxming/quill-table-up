import type Quill from 'quill';

declare global {
  interface Window {
    quills: Quill[];
  }
}
