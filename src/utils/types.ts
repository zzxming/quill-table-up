import type Quill from 'quill';
import type BaseTheme from 'quill/themes/base';
import type Picker from 'quill/ui/picker';
import type { TableCellInnerFormat, TableUp } from '..';

export type QuillThemePicker = (Picker & { options: HTMLElement });
export interface QuillTheme extends BaseTheme {
  pickers: QuillThemePicker[];
}
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
  tools: Tool[];
  localstorageKey: string;
  defaultColorMap: string[];
}
export interface TableSelectionOptions {
  selectColor: string;
  tableMenu?: Constructor<InternalModule, [TableUp, Quill, Partial<TableMenuOptions>]>;
  tableMenuOptions: TableMenuOptions;
}
export interface TableResizeScaleOptions {
  blockSize: number;
}
export interface TableCreatorTextOptions {
  fullCheckboxText: string;
  customBtnText: string;
  confirmText: string;
  cancelText: string;
  rowText: string;
  colText: string;
  notPositiveNumberError: string;
  perWidthInsufficient: string;
}
export type TableMenuTexts = Record<string, string>;
export interface TableTextOptions extends TableCreatorTextOptions, TableMenuTexts {
  custom: string;
  clear: string;
  transparent: string;
  perWidthInsufficient: string;
}
export interface TableUpOptions {
  customSelect?: (tableModule: TableUp, picker: QuillThemePicker) => Promise<HTMLElement> | HTMLElement;
  full: boolean;
  fullSwitch: boolean;
  customBtn: boolean;
  texts: TableTextOptions;
  icon: string;
  selection?: Constructor<InternalTableSelectionModule, [TableUp, Quill, Partial<TableSelectionOptions>]>;
  selectionOptions: Partial<TableSelectionOptions>;
  resize?: Constructor<InternalModule, [TableUp, HTMLElement, Quill, any]>;
  resizeOptions: any;
  scrollbar?: Constructor<InternalModule, [TableUp, HTMLElement, Quill, any]>;
  scrollbarOptions: any;
  align?: Constructor<InternalModule, [TableUp, HTMLElement, Quill, any]>;
  alignOptions: any;
  resizeScale?: Constructor<InternalModule, [TableUp, HTMLElement, Quill, Partial<TableResizeScaleOptions>]>;
  resizeScaleOptions: Partial<TableResizeScaleOptions>;
}
export interface TableColValue {
  tableId: string;
  colId: string;
  width: string;
  full?: boolean;
  align?: string;
}
export interface TableCellValue {
  tableId: string;
  rowId: string;
  colId: string;
  rowspan: number;
  colspan: number;
  style?: string;
}
export interface TableRowValue {
  tableId: string;
  rowId: string;
}
export interface TableValue {
  tableId: string;
  full?: boolean;
  align?: string;
}

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
}
export type Constructor<T = any, U extends Array<any> = any[]> = new (...args: U) => T;
export interface InternalTableSelectionModule extends InternalModule {
  dragging: boolean;
  boundary: RelactiveRect | null;
  selectedTds: TableCellInnerFormat[];
  cellSelect: HTMLElement;
  tableMenu?: InternalModule;
  computeSelectedTds: (
    startPoint: {
      x: number;
      y: number;
    },
    endPoint: {
      x: number;
      y: number;
    }
  ) => TableCellInnerFormat[];
  updateWithSelectedTds: () => void;
}
export interface TableConstantsData {
  blotName: Record<string, string>;
  tableUpSize: Record<string, number>;
  tableUpEvent: Record<string, string>;
}
