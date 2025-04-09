import type { Tool } from '../../utils';
import Background from '../../svg/background.svg';
import Border from '../../svg/border.svg';
import Copy from '../../svg/copy.svg';
import Cut from '../../svg/cut.svg';
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
export const tableMenuTools: Record<string, Tool> = {
  Break: {
    name: 'break',
  },
  CopyCell: {
    name: 'CopyCell',
    tip: 'Copy cell',
    icon: Copy,
    handle: (tableModule, selectedTds) => {
      const text = tableModule.getTextByCell(selectedTds);
      const html = tableModule.getHTMLByCell(selectedTds);

      const clipboardItem = new ClipboardItem({
        'text/plain': new Blob([text], { type: 'text/plain' }),
        'text/html': new Blob([html], { type: 'text/html' }),
      });
      navigator.clipboard.write([clipboardItem]);
      tableModule.hideTableTools();
    },
  },
  CutCell: {
    name: 'CutCell',
    tip: 'Cut cell',
    icon: Cut,
    handle: (tableModule, selectedTds) => {
      const text = tableModule.getTextByCell(selectedTds);
      const html = tableModule.getHTMLByCell(selectedTds, true);

      const clipboardItem = new ClipboardItem({
        'text/plain': new Blob([text], { type: 'text/plain' }),
        'text/html': new Blob([html], { type: 'text/html' }),
      });
      navigator.clipboard.write([clipboardItem]);
      tableModule.hideTableTools();
    },
  },
  InsertTop: {
    name: 'InsertTop',
    icon: InsertTop,
    tip: 'Insert row above',
    handle: (tableModule, selectedTds) => {
      tableModule.appendRow(selectedTds, false);
      tableModule.hideTableTools();
    },
  },
  InsertRight: {
    name: 'InsertRight',
    icon: InsertRight,
    tip: 'Insert column right',
    handle: (tableModule, selectedTds) => {
      tableModule.appendCol(selectedTds, true);
      tableModule.hideTableTools();
    },
  },
  InsertBottom: {
    name: 'InsertBottom',
    icon: InsertBottom,
    tip: 'Insert row below',
    handle: (tableModule, selectedTds) => {
      tableModule.appendRow(selectedTds, true);
      tableModule.hideTableTools();
    },
  },
  InsertLeft: {
    name: 'InsertLeft',
    icon: InsertLeft,
    tip: 'Insert column Left',
    handle: (tableModule, selectedTds) => {
      tableModule.appendCol(selectedTds, false);
      tableModule.hideTableTools();
    },
  },
  MergeCell: {
    name: 'MergeCell',
    icon: MergeCell,
    tip: 'Merge Cell',
    handle: (tableModule, selectedTds) => {
      tableModule.mergeCells(selectedTds);
      tableModule.hideTableTools();
    },
  },
  SplitCell: {
    name: 'SplitCell',
    icon: SplitCell,
    tip: 'Split Cell',
    handle: (tableModule, selectedTds) => {
      tableModule.splitCell(selectedTds);
      tableModule.hideTableTools();
    },
  },
  DeleteRow: {
    name: 'DeleteRow',
    icon: RemoveRow,
    tip: 'Delete Row',
    handle: (tableModule, selectedTds) => {
      tableModule.removeRow(selectedTds);
      tableModule.hideTableTools();
    },
  },
  DeleteColumn: {
    name: 'DeleteColumn',
    icon: RemoveColumn,
    tip: 'Delete Column',
    handle: (tableModule, selectedTds) => {
      tableModule.removeCol(selectedTds);
      tableModule.hideTableTools();
    },
  },
  DeleteTable: {
    name: 'DeleteTable',
    icon: RemoveTable,
    tip: 'Delete table',
    handle: (tableModule, selectedTds) => {
      tableModule.deleteTable(selectedTds);
    },
  },
  BackgroundColor: {
    name: 'BackgroundColor',
    icon: Background,
    isColorChoose: true,
    tip: 'Set background color',
    key: 'background-color',
    handle: (tableModule, selectedTds, color) => {
      tableModule.setCellAttrs(selectedTds, 'background-color', color, true);
    },
  },
  BorderColor: {
    name: 'BorderColor',
    icon: Border,
    isColorChoose: true,
    tip: 'Set border color',
    key: 'border-color',
    handle: (tableModule, selectedTds, color) => {
      tableModule.setCellAttrs(selectedTds, 'border-color', color, true);
    },
  },
};

export const maxSaveColorCount = 10;
const bem = createBEM('color-map');
export const colorClassName = {
  selectWrapper: bem.b(),
  used: bem.bm('used'),
  item: bem.be('item'),
  btn: bem.be('btn'),
  map: bem.be('content'),
  mapRow: bem.be('content-row'),
};
