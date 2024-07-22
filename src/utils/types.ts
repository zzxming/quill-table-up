import type TableUp from '..';

export type AnyClass = new (...arg: any[]) => any;

export interface ToolOption {
  name: string;
  icon: string;
  tip?: string;
  handle: (tableModule: TableUp, e: MouseEvent) => void;
};
export interface ToolOptionBreak {
  name: 'break';
}
export type Tool = ToolOption | ToolOptionBreak;

export interface TableSelectionOptions {
  selectColor: string;
  tools: Tool[];
}
export interface TableTextOptions {
  customBtnText?: string;
  confirmText?: string;
  cancelText?: string;
  rowText?: string;
  colText?: string;
  notPositiveNumberError?: string;
}
export interface TableUpOptions {
  customSelect?: (this: TableUp) => HTMLElement;
  isCustom?: boolean;
  texts?: TableTextOptions;
  selection?: TableSelectionOptions;
}
