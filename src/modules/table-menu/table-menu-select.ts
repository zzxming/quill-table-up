import type Quill from 'quill';
import type { TableUp } from '../../table-up';
import type { TableMenuOptionsInput } from './table-menu-common';
import { computePosition, flip, limitShift, offset, shift } from '@floating-ui/dom';
import { TableMenuCommon } from './table-menu-common';

export class TableMenuSelect extends TableMenuCommon {
  constructor(public tableModule: TableUp, public quill: Quill, options: TableMenuOptionsInput) {
    super(tableModule, quill, options);

    this.menu = this.buildTools();
    this.tableModule.addContainer(this.menu);
    this.show();
    this.update();
  }

  update() {
    if (!this.isMenuDisplay || !this.menu || !this.tableModule.tableSelection || !this.tableModule.tableSelection.isDisplaySelection) return;
    super.update();

    computePosition(this.tableModule.tableSelection.cellSelect, this.menu, {
      placement: 'bottom',
      middleware: [flip(), shift({ limiter: limitShift() }), offset(20)],
    }).then(({ x, y }) => {
      Object.assign(this.menu!.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  }
}
