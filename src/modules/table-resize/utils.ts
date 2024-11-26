import type { TableMainFormat } from '../../formats';

export const isTableAlignRight = (tableMainBlot: TableMainFormat) => !tableMainBlot.full && tableMainBlot.align === 'right';
