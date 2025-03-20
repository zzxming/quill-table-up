import type { TableMainFormat, TableWrapperFormat } from '../formats';
import type { TableUp } from '../table-up';
import { autoUpdate, computePosition, flip, limitShift, offset, shift } from '@floating-ui/dom';
import Quill from 'quill';
import { createBEM, createResizeObserver } from '../utils';

export class TableAlign {
  tableBlot: TableMainFormat;
  tableWrapperBlot: TableWrapperFormat;
  alignBox?: HTMLElement;
  cleanup?: () => void;
  bem = createBEM('align');
  resizeObserver = createResizeObserver(() => this.update(), { ignoreFirstBind: true });

  constructor(public tableModule: TableUp, public table: HTMLElement, public quill: Quill) {
    this.tableBlot = Quill.find(table)! as TableMainFormat;
    this.tableWrapperBlot = this.tableBlot.parent as TableWrapperFormat;

    this.alignBox = this.buildTool();
    this.resizeObserver.observe(this.table);
    this.quill.on(Quill.events.TEXT_CHANGE, this.updateWhenTextChange);

    this.show();
  }

  updateWhenTextChange = () => {
    this.update();
  };

  buildTool() {
    const alignBox = this.tableModule.addContainer(this.bem.b());
    const icons = Quill.import('ui/icons') as Record<string, any>;
    const alignIcons = {
      left: icons.align[''],
      center: icons.align.center,
      right: icons.align.right,
    };
    for (const [align, iconStr] of Object.entries(alignIcons)) {
      const item = document.createElement('span');
      item.dataset.align = align;
      item.classList.add(this.bem.be('item'));
      item.innerHTML = `<i class="icon">${iconStr}</i>`;
      item.addEventListener('click', () => {
        const value = item.dataset.align;
        if (value) {
          this.setTableAlign(this.tableBlot, value);

          this.quill.once(Quill.events.SCROLL_OPTIMIZE, () => {
            if (this.tableModule.tableSelection) {
              this.tableModule.tableSelection.hide();
            }
            if (this.tableModule.tableResize) {
              this.tableModule.tableResize.update();
            }
            if (this.tableModule.tableResizeScale) {
              this.tableModule.tableResizeScale.update();
            }
            if (this.tableModule.tableScrollbar) {
              this.tableModule.tableScrollbar.update();
            }
          });
        }
      });
      alignBox.appendChild(item);
    }
    if (!this.cleanup) {
      this.cleanup = autoUpdate(
        this.tableWrapperBlot.domNode,
        alignBox,
        () => this.update(),
      );
    }
    return alignBox;
  }

  setTableAlign(tableBlot: TableMainFormat, align: string) {
    const cols = tableBlot.getCols();
    for (const col of cols) {
      col.align = align;
    }
  }

  show() {
    if (!this.alignBox) return;
    this.alignBox.classList.add(this.bem.bm('active'));
    this.update();
  }

  hide() {
    if (!this.alignBox) return;
    console.log('hide');
    this.alignBox.classList.remove(this.bem.bm('active'));
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = undefined;
    }
  }

  update() {
    if (!this.alignBox) return;
    if (this.tableBlot.full || this.tableBlot.domNode.offsetWidth >= this.quill.root.offsetWidth) {
      this.hide();
      return;
    }

    computePosition(this.tableWrapperBlot.domNode, this.alignBox, {
      placement: 'top',
      middleware: [flip(), shift({ limiter: limitShift() }), offset(16)],
    }).then(({ x, y }) => {
      Object.assign(this.alignBox!.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  }

  destroy() {
    this.hide();
    this.resizeObserver.disconnect();
    this.quill.off(Quill.events.TEXT_CHANGE, this.updateWhenTextChange);
    if (this.alignBox) {
      this.alignBox.remove();
      this.alignBox = undefined;
    }
  }
}
