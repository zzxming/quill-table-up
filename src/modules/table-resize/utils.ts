import type { TableColFormat, TableMainFormat } from '../../formats';

export const isTableAlignRight = (tableMainBlot: TableMainFormat) => !tableMainBlot.full && tableMainBlot.align === 'right';
export function getColRect(cols: TableColFormat[], columnIndex: number) {
  // fix browser compatibility, get column rect left/x inaccurate
  if (columnIndex < 0 || columnIndex >= cols.length) return null;

  // calculate column position
  let left = cols[0].domNode.getBoundingClientRect().left;
  for (let i = 0; i < columnIndex; i++) {
    const colRect = cols[i].domNode.getBoundingClientRect();
    left += colRect.width;
  }

  const currentCol = cols[columnIndex];
  const colWidth = currentCol.domNode.getBoundingClientRect().width;

  return {
    left,
    right: left + colWidth,
    width: colWidth,
  };
}
