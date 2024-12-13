import type Quill from 'quill';
import type { TableCellInnerFormat, TableUp } from '..';

export interface ToolOption {
  name: string;
  icon: string | ((tableModule: TableUp) => HTMLElement);
  tip?: string;
  isColorChoose?: boolean;
  key?: string;
  handle: (tableModule: TableUp, selectedTds: TableCellInnerFormat[], e: Event | string | null) => void;
}
export interface ToolOptionBreak {
  name: 'break';
}
export type Tool = ToolOption | ToolOptionBreak;

export interface TableMenuOptions {
  tipText: boolean;
  tipTexts: Record<string, string>;
  tools: Tool[];
  localstorageKey: string;
  defaultColorMap: string[];
};
export interface TableSelectionOptions {
  selectColor: string;
  tableMenu?: Constructor<InternalModule, [TableUp, Quill, Partial<TableMenuOptions>]>;
  tableMenuOptions: TableMenuOptions;
}
export interface TableCreatorTextOptions {
  customBtnText: string;
  confirmText: string;
  cancelText: string;
  rowText: string;
  colText: string;
  notPositiveNumberError: string;
  perWidthInsufficient: string;
};
export interface TableTextOptions extends TableCreatorTextOptions {
  custom: string;
  clear: string;
  transparent: string;
  perWidthInsufficient: string;
}
export interface TableUpOptions {
  customSelect?: (tableModule: TableUp) => HTMLElement;
  full: boolean;
  customBtn: boolean;
  texts: TableTextOptions;
  icon: string;
  selection?: TableSelectionOptions;
  resize?: Constructor<InternalModule, [TableUp, HTMLElement, Quill, any]>;
  resizeOptions?: any;
  scrollbar?: Constructor<InternalModule, [TableUp, HTMLElement, Quill, any]>;
  scrollbarOptions?: any;
  align?: Constructor<InternalModule, [TableUp, HTMLElement, Quill, any]>;
  alignOptions?: any;
}
export interface TableColValue {
  tableId: string;
  colId: string;
  width: string;
  full?: boolean;
  align?: string;
};
export interface TableCellValue {
  tableId: string;
  rowId: string;
  colId: string;
  rowspan: number;
  colspan: number;
  style?: string;
  // TODO: remove attributes that are not used
  backgroundColor?: string;
  borderColor?: string;
  height?: string;
};
export interface TableRowValue {
  tableId: string;
  rowId: string;
}
export interface TableValue {
  tableId: string;
  full?: boolean;
  align?: string;
};

export interface RelactiveRect {
  x: number;
  y: number;
  x1: number;
  y1: number;
  width: number;
  height: number;
}

export interface InternalModule {
  show: () => void;
  hide: () => void;
  update: () => void;
  destroy: () => void;
};
export type Constructor<T = any, U extends Array<any> = any[]> = new (...args: U) => T;

export interface TableConstantsData {
  blotName: Record<string, string>;
  tableUpSize: Record<string, number>;
  tableUpEvent: Record<string, string>;
};
