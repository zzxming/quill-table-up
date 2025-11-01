import { blotName } from '../utils';
import { TableBodyFormat } from './table-body-format';

export class TableFootFormat extends TableBodyFormat {
  static blotName = blotName.tableFoot;
  static tagName = 'tfoot';
}
