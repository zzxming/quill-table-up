import type TableUp from '..';
import type { TableMainFormat, TableWrapperFormat } from '../formats';
import { autoUpdate, computePosition, flip, limitShift, offset, shift } from '@floating-ui/dom';
import Quill from 'quill';

export class TableAlign {
  tableBlot: TableMainFormat;
  tableWrapperBlot: TableWrapperFormat;
  alignBox?: HTMLElement;
  cleanup?: () => void;
  constructor(public tableModule: TableUp, public table: HTMLElement, public quill: Quill) {
    this.tableBlot = Quill.find(table)! as TableMainFormat;
    this.tableWrapperBlot = this.tableBlot.parent as TableWrapperFormat;

    if (!this.tableBlot.full) {
      this.alignBox = this.buildTool();
      this.cleanup = autoUpdate(
        this.tableWrapperBlot.domNode,
        this.alignBox,
        () => this.update(),
      );
      this.update();
    }
  }

  buildTool() {
    const alignBox = this.tableModule.addContainer('ql-table-align');
    const icons = Quill.import('ui/icons') as Record<string, any>;
    const alignIcons = {
      left: icons.align[''],
      center: icons.align.center,
      right: icons.align.right,
    };
    for (const [align, iconStr] of Object.entries(alignIcons)) {
      const item = document.createElement('span');
      item.dataset.align = align;
      item.classList.add('ql-table-align-item');
      item.innerHTML = `<i class="icon">${iconStr}</i>`;
      item.addEventListener('click', () => {
        const value = item.dataset.align;
        if (value) {
          this.setTableAlign(this.tableBlot, value);

          if (this.tableModule.tableSelection) {
            this.tableModule.tableSelection.hideSelection();
          }
          if (this.tableModule.tableResize) {
            this.tableModule.tableResize.update();
          }
        }
      });
      alignBox.appendChild(item);
    }
    return alignBox;
  }

  setTableAlign(tableBlot: TableMainFormat, align: string) {
    const cols = tableBlot.getCols();
    for (const col of cols) {
      col.align = align;
    }
  }

  update() {
    if (!this.alignBox) return;
    Object.assign(this.alignBox.style, { display: 'flex' });
    computePosition(this.tableWrapperBlot.domNode, this.alignBox, {
      placement: 'top',
      middleware: [flip(), shift({ limiter: limitShift() }), offset(8)],
    }).then(({ x, y }) => {
      Object.assign(this.alignBox!.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  }

  destroy() {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = undefined;
    }
    if (this.alignBox) {
      this.alignBox.remove();
      this.alignBox = undefined;
    }
  }
}
