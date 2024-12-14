import type { Tool } from '../../utils';
import Background from '../../svg/background.svg';
import Border from '../../svg/border.svg';
import InsertBottom from '../../svg/insert-bottom.svg';
import InsertLeft from '../../svg/insert-left.svg';
import InsertRight from '../../svg/insert-right.svg';
import InsertTop from '../../svg/insert-top.svg';
import MergeCell from '../../svg/merge-cell.svg';
import RemoveColumn from '../../svg/remove-column.svg';
import RemoveRow from '../../svg/remove-row.svg';
import RemoveTable from '../../svg/remove-table.svg';
import SplitCell from '../../svg/split-cell.svg';
import { createBEM } from '../../utils';

export const menuColorSelectClassName = 'color-selector';
export const defaultTools: Tool[] = [
  {
    name: 'InsertTop',
    icon: InsertTop,
    tip: 'Insert row above',
    handle: (tableModule) => {
      tableModule.appendRow(false);
      tableModule.hideTableTools();
    },
  },
  {
    name: 'InsertRight',
    icon: InsertRight,
    tip: 'Insert column right',
    handle: (tableModule) => {
      tableModule.appendCol(true);
      tableModule.hideTableTools();
    },
  },
  {
    name: 'InsertBottom',
    icon: InsertBottom,
    tip: 'Insert row below',
    handle: (tableModule) => {
      tableModule.appendRow(true);
      tableModule.hideTableTools();
    },
  },
  {
    name: 'InsertLeft',
    icon: InsertLeft,
    tip: 'Insert column Left',
    handle: (tableModule) => {
      tableModule.appendCol(false);
      tableModule.hideTableTools();
    },
  },
  {
    name: 'break',
  },
  {

    name: 'MergeCell',
    icon: MergeCell,
    tip: 'Merge Cell',
    handle: (tableModule) => {
      tableModule.mergeCells();
      tableModule.hideTableTools();
    },
  },
  {

    name: 'SplitCell',
    icon: SplitCell,
    tip: 'Split Cell',
    handle: (tableModule) => {
      tableModule.splitCell();
      tableModule.hideTableTools();
    },
  },
  {
    name: 'break',
  },
  {
    name: 'DeleteRow',
    icon: RemoveRow,
    tip: 'Delete Row',
    handle: (tableModule) => {
      tableModule.removeRow();
      tableModule.hideTableTools();
    },
  },
  {
    name: 'DeleteColumn',
    icon: RemoveColumn,
    tip: 'Delete Column',
    handle: (tableModule) => {
      tableModule.removeCol();
      tableModule.hideTableTools();
    },
  },
  {
    name: 'DeleteTable',
    icon: RemoveTable,
    tip: 'Delete table',
    handle: (tableModule) => {
      tableModule.deleteTable();
    },
  },
  {
    name: 'break',
  },
  {
    name: 'BackgroundColor',
    icon: Background,
    isColorChoose: true,
    tip: 'Set background color',
    key: 'background-color',
    handle: (tableModule, selectedTds, color) => {
      tableModule.setCellAttrs(selectedTds, 'background-color', color, true);
    },
  },
  {
    name: 'BorderColor',
    icon: Border,
    isColorChoose: true,
    tip: 'Set border color',
    key: 'border-color',
    handle: (tableModule, selectedTds, color) => {
      tableModule.setCellAttrs(selectedTds, 'border-color', color, true);
    },
  },
];

export const maxSaveColorCount = 10;
export const usedColors = new Set<string>();
const bem = createBEM('color-map');
export const colorClassName = {
  selectWrapper: bem.b(),
  used: bem.bm('used'),
  item: bem.be('item'),
  btn: bem.be('btn'),
  map: bem.be('content'),
  mapRow: bem.be('content-row'),
};
