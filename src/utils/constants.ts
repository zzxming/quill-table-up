import type { Parchment as TypeParchment } from 'quill';

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
  colMinWidthPx: 40,
  colDefaultWidth: '100',
  rowMinHeightPx: 36,
};

export const tableUpEvent = {
  AFTER_TABLE_RESIZE: 'after-table-resize',
};

export const defaultColorMap = [
  [
    'rgb(255, 255, 255)',
    'rgb(0, 0, 0)',
    'rgb(72, 83, 104)',
    'rgb(41, 114, 244)',
    'rgb(0, 163, 245)',
    'rgb(49, 155, 98)',
    'rgb(222, 60, 54)',
    'rgb(248, 136, 37)',
    'rgb(245, 196, 0)',
    'rgb(153, 56, 215)',
  ],
  [
    'rgb(242, 242, 242)',
    'rgb(127, 127, 127)',
    'rgb(243, 245, 247)',
    'rgb(229, 239, 255)',
    'rgb(229, 246, 255)',
    'rgb(234, 250, 241)',
    'rgb(254, 233, 232)',
    'rgb(254, 243, 235)',
    'rgb(254, 249, 227)',
    'rgb(253, 235, 255)',
  ],
  [
    'rgb(216, 216, 216)',
    'rgb(89, 89, 89)',
    'rgb(197, 202, 211)',
    'rgb(199, 220, 255)',
    'rgb(199, 236, 255)',
    'rgb(195, 234, 213)',
    'rgb(255, 201, 199)',
    'rgb(255, 220, 196)',
    'rgb(255, 238, 173)',
    'rgb(242, 199, 255)',
  ],
  [
    'rgb(191, 191, 191)',
    'rgb(63, 63, 63)',
    'rgb(128, 139, 158)',
    'rgb(153, 190, 255)',
    'rgb(153, 221, 255)',
    'rgb(152, 215, 182)',
    'rgb(255, 156, 153)',
    'rgb(255, 186, 132)',
    'rgb(255, 226, 112)',
    'rgb(213, 142, 255)',
  ],
  [
    'rgb(165, 165, 165)',
    'rgb(38, 38, 38)',
    'rgb(53, 59, 69)',
    'rgb(20, 80, 184)',
    'rgb(18, 116, 165)',
    'rgb(39, 124, 79)',
    'rgb(158, 30, 26)',
    'rgb(184, 96, 20)',
    'rgb(163, 130, 0)',
    'rgb(94, 34, 129)',
  ],
  [
    'rgb(147, 147, 147)',
    'rgb(13, 13, 13)',
    'rgb(36, 39, 46)',
    'rgb(12, 48, 110)',
    'rgb(10, 65, 92)',
    'rgb(24, 78, 50)',
    'rgb(88, 17, 14)',
    'rgb(92, 48, 10)',
    'rgb(102, 82, 0)',
    'rgb(59, 21, 81)',
  ],
];

export const cssNamespace = 'table-up';

// Blots that cannot be inserted into a table
export const tableCantInsert: Set<string> = new Set([blotName.tableCellInner]);

export const isForbidInTableBlot = (blot: TypeParchment.Blot) => tableCantInsert.has(blot.statics.blotName);
export const isForbidInTable = (current: TypeParchment.Blot): boolean =>
  current && current.parent
    ? isForbidInTableBlot(current.parent)
      ? true
      : isForbidInTable(current.parent)
    : false;
