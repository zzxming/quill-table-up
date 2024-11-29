import { isValidCellspan } from '../utils';

export const getValidCellspan = (value: any) => isValidCellspan(value) ? value : 1;
