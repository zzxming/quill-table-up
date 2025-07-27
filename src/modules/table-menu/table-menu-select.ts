import type Quill from 'quill';
import type { TableCellInnerFormat } from '../../formats';
import type { TableUp } from '../../table-up';
import type { InternalTableSelectionModule } from '../../utils';
import type { TableSelection } from '../table-selection';
import type { TableMenuOptionsInput } from './table-menu-common';
import { computePosition, flip, limitShift, offset, shift } from '@floating-ui/dom';
import { tableUpEvent } from '../../utils';
import { TableMenuCommon } from './table-menu-common';

export class TableMenuSelect extends TableMenuCommon {
  constructor(public tableModule: TableUp, public quill: Quill, options: TableMenuOptionsInput) {
    super(tableModule, quill, options);

    this.quill.on(tableUpEvent.TABLE_SELECTION_DRAG_START, this.tableSelectionDragStart);
    this.quill.on(tableUpEvent.TABLE_SELECTION_DRAG_END, this.tableSelectionDragEnd);
    this.quill.on(tableUpEvent.TABLE_SELECTION_CHANGE, this.tableSelectioChange);
    this.quill.on(tableUpEvent.TABLE_SELECTION_DISPLAY_CHANGE, this.tableSelectionDisplayChange);
  }

  tableSelectionDragStart = () => {
    this.hide();
  };

  tableSelectionDragEnd = (tableSelection: InternalTableSelectionModule) => {
    if (tableSelection.selectedTds.length > 0) {
      this.show();
    }
  };

  tableSelectioChange = (tableSelection: InternalTableSelectionModule, selectedTds: TableCellInnerFormat[]) => {
    if (selectedTds.length <= 0) {
      this.hide();
    }
  };

  tableSelectionDisplayChange = (tableSelection: InternalTableSelectionModule) => {
    if (!tableSelection.dragging) {
      this.update();
    }
  };

  buildTools(): HTMLElement {
    const menu = super.buildTools();
    this.tableModule.addContainer(menu);
    return menu;
  }

  show() {
    super.show();
    this.update();
  }

  update() {
    if (!this.menu && this.table) {
      this.show();
      return;
    }
    const selectedTds = this.getSelectedTds();
    if (!this.menu || selectedTds.length === 0) {
      if (this.menu) {
        this.isMenuDisplay = false;
        this.menu.classList.add(this.bem.is('hidden'));
      }
      return;
    }
    this.isMenuDisplay = true;
    this.menu.classList.remove(this.bem.is('hidden'));
    super.update();

    const tableSelection = this.tableModule.getModule<TableSelection>('table-selection');
    if (tableSelection?.isDisplaySelection) {
      computePosition(tableSelection.cellSelect, this.menu, {
        placement: 'bottom',
        middleware: [flip(), shift({ limiter: limitShift() }), offset(20)],
      }).then(({ x, y }) => {
        if (this.menu) {
          Object.assign(this.menu.style, {
            left: `${x}px`,
            top: `${y}px`,
          });
        }
      });
    }
  }

  destroy(): void {
    super.destroy();

    this.quill.off(tableUpEvent.TABLE_SELECTION_DRAG_START, this.tableSelectionDragStart);
    this.quill.off(tableUpEvent.TABLE_SELECTION_DRAG_END, this.tableSelectionDragEnd);
  }
}
