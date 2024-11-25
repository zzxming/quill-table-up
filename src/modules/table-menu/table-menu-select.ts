import type Quill from 'quill';
import type { TableMenuOptionsInput, TableUp } from '../..';
import { computePosition, flip, limitShift, offset, shift } from '@floating-ui/dom';
import { TableMenuCommon } from './table-menu-common';

export class TableMenuSelect extends TableMenuCommon {
  constructor(public tableModule: TableUp, public quill: Quill, options: TableMenuOptionsInput) {
    super(tableModule, quill, options);

    this.menu = this.buildTools();
    this.tableModule.addContainer(this.menu);
  }

  updateTools() {
    if (!this.menu || !this.tableModule.tableSelection || !this.tableModule.tableSelection.boundary) return;
    super.updateTools();

    computePosition(this.tableModule.tableSelection.cellSelect, this.menu, {
      placement: 'bottom',
      middleware: [flip(), shift({ limiter: limitShift() }), offset(8)],
    }).then(({ x, y }) => {
      Object.assign(this.menu!.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  }

  destroy() {
    for (const tooltip of this.tooltipItem) tooltip.destroy();
    if (!this.menu) return;
    this.menu.remove();
    this.menu = null;
  }
}
