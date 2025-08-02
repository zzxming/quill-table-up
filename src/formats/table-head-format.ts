import { blotName } from '../utils';
import { TableBodyFormat } from './table-body-format';

export class TableHeadFormat extends TableBodyFormat {
  static blotName = blotName.tableHead;
  static tagName = 'thead';
}
