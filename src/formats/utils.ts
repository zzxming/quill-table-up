import { isValidCellspan } from '../utils';

export const getValidCellspan = (value: unknown) => isValidCellspan(value) ? value : 1;
export function getValidTrWrapTag(value: string) {
  if (['tbody', 'tfoot'].includes(value)) {
    return value as 'tbody' | 'tfoot';
  }
  return 'tbody';
}
