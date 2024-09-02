import type Quill from 'quill';
import type { TableResizeOptions } from '../utils';
import type TableUp from '..';

export class TableResize {
  options: TableResizeOptions;

  constructor(public tableModule: TableUp, public table: HTMLElement, public quill: Quill, options: Partial<TableResizeOptions>) {
    this.options = this.resolveOptions(options);
  }

  resolveOptions(options: Partial<TableResizeOptions>) {
    return Object.assign({
      size: 12,
    }, options);
  }

  destroy() {

  }
}
