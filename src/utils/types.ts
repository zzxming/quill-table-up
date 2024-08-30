import type { Parchment } from 'quill';
// import type TableUp from '..';

// export type AnyClass = new (...arg: any[]) => any;

// export interface ToolOption {
//   name: string;
//   icon: string | ((tableModule: TableUp) => HTMLElement);
//   tip?: string;
//   handle: (tableModule: TableUp, e: MouseEvent) => void;
// };
// export interface ToolOptionBreak {
//   name: 'break';
// }
// export type Tool = ToolOption | ToolOptionBreak;

// export interface TableSelectionOptions {
//   selectColor: string;
//   tipText: boolean;
//   tools: Tool[];
//   localstorageKey: string;
// }
export interface TableTextOptions {
  customBtnText?: string;
  confirmText?: string;
  cancelText?: string;
  rowText?: string;
  colText?: string;
  notPositiveNumberError?: string;
}
// export interface TableUpOptions {
//   customSelect?: (this: TableUp) => HTMLElement;
//   isCustom?: boolean;
//   texts?: TableTextOptions;
//   selection?: TableSelectionOptions;
// }
export interface TableColValue {
  tableId: string;
  colId: string;
  width: string;
  full: boolean;
};
export interface TableCellValue {
  tableId: string;
  rowId: string;
  colId: string;
  rowspan: number;
  colspan: number;
};

export type ContainerConstructor = typeof Parchment.ContainerBlot;
