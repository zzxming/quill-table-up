import { blotName, isValidCellspan } from '../utils';

export const getValidCellspan = (value: unknown) => isValidCellspan(value) ? value : 1;

export const tableBodyBlotNameMap: Record<string, string> = {
  thead: blotName.tableHead,
  tbody: blotName.tableBody,
  tfoot: blotName.tableFoot,
};
