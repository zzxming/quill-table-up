export const blotName = {
  container: 'table-up-container',
  tableWrapper: 'table-up',
  tableMain: 'table-up-main',
  tableColgroup: 'table-up-colgroup',
  tableCol: 'table-up-col',
  tableBody: 'table-up-body',
  tableRow: 'table-up-row',
  tableCell: 'table-up-cell',
  tableCellInner: 'table-up-cell-inner',
} as const;

export const tableUpSize = {
  colMinWidthPre: 5,
  colMinWidthPx: 26,
  rowMinHeightPx: 36,
};

export const tableUpEvent = {
  AFTER_TABLE_RESIZE: 'after-table-resize',
};
