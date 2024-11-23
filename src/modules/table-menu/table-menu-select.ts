import type Quill from 'quill';
import type { TableMenuOptionsInput, TableUp } from '../..';
import { computePosition, flip, limitShift, offset, shift } from '@floating-ui/dom';
import { TableMenuCommon } from './table-menu-common';

export class TableMenuSelect extends TableMenuCommon {
  constructor(public tableModule: TableUp, public quill: Quill, options: TableMenuOptionsInput) {
    super(tableModule, quill, options);

    this.menu = this.buildTools();
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
    // const { boundary, selectedTds } = this.tableModule.tableSelection;
    // this.selectedTds = selectedTds;
    // const style: Record<string, any> = {
    //   display: 'flex',
    //   left: 0,
    //   top: 0,
    // };
    // const containerRect = this.quill.container.getBoundingClientRect();
    // style.left = containerRect.left + boundary.x + (boundary.width / 2);
    // style.top = containerRect.top + boundary.y + boundary.height;
    // style.transform = `translate(-50%, 20%)`;

    // Object.assign(this.menu.style, {
    //   ...style,
    //   left: `${style.left + window.scrollX}px`,
    //   top: `${style.top + window.scrollY}px`,
    // });

    // // limit menu in viewport
    // const menuRect = this.menu.getBoundingClientRect();
    // const { left: limitLeft, top: limitTop, leftLimited } = limitDomInViewPort(menuRect);
    // Object.assign(this.menu.style, {
    //   left: `${limitLeft + window.scrollX}px`,
    //   top: `${limitTop + window.scrollY}px`,
    //   transform: leftLimited ? `translate(0%, 20%)` : null,
    // });
  }

  destroy() {
    for (const tooltip of this.tooltipItem) tooltip.destroy();
    if (!this.menu) return;
    this.menu.remove();
    this.menu = null;
  }
}
