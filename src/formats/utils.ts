import { isValidCellspan } from '../utils';

export const getValidCellspan = (value: unknown) => isValidCellspan(value) ? value : 1;
