import type { TableUp } from '../table-up';
import Quill from 'quill';

export class TableDomSelector {
  table?: HTMLTableElement;

  constructor(public tableModule: TableUp, public quill: Quill) {
    this.quill.root.addEventListener('mousedown', this.mouseDownHandler.bind(this));
    this.quill.on(Quill.events.EDITOR_CHANGE, (eventName: string) => {
      if (eventName === Quill.events.TEXT_CHANGE && this.table) {
        this.setSelectionTable(undefined);
      }
    });
  }

  mouseDownHandler(event: MouseEvent) {
    const path = event.composedPath() as HTMLElement[];
    if (event.button !== 0 || !path || path.length <= 0) return;
    const tableNode = path.find(node => node.tagName && node.tagName.toUpperCase() === 'TABLE');
    this.setSelectionTable(tableNode as HTMLTableElement);
  }

  setSelectionTable(table: HTMLTableElement | undefined) {
    if (this.table === table) return;
    this.table = table;
    this.update();
  }

  update() {}
}
