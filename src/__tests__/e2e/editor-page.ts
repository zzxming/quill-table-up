import type { Page } from '@playwright/test';
import type { Delta, Op } from 'quill';

// Specify the index of the editor before use.
export class EditorPage {
  public index: number = 0;
  constructor(protected readonly page: Page) {}

  get root() {
    return this.page.locator('.ql-editor');
  }

  async html(content: string) {
    await this.page.evaluate(({ index, content: html }) => {
      const contents = window.quills[index].clipboard.convert({ html, text: '\n' });
      return window.quills[index].setContents(contents);
    }, { index: this.index, content });
  }

  getSelection() {
    return this.page.evaluate(({ index }) => {
      return window.quills[index].getSelection();
    }, { index: this.index });
  }

  async setSelection(index: number, length: number): Promise<void>;
  async setSelection(range: { index: number; length: number }): Promise<void>;
  async setSelection(
    range: { index: number; length: number } | number,
    length?: number,
  ) {
    await this.page.evaluate(
      ({ index, range }) => window.quills[index].setSelection(range),
      { index: this.index, range: typeof range === 'number' ? { index: range, length: length || 0 } : range },
    );
  }

  async updateContents(delta: Op[], source: 'api' | 'user' = 'api') {
    await this.page.evaluate(
      ({ index, delta, source }) => {
        window.quills[index].updateContents(delta, source);
      },
      { index: this.index, delta, source },
    );
  }

  async setContents(delta: Op[]) {
    await this.page.evaluate(({ index, delta }) => {
      window.quills[index].setContents(delta);
    }, { index: this.index, delta });
  }

  getContents(): Promise<Delta> {
    return this.page.evaluate(({ index }) => {
      return window.quills[index].getContents();
    }, { index: this.index });
  }

  focus(): Promise<void> {
    return this.page.evaluate(({ index }) => {
      return window.quills[index].focus();
    }, { index: this.index });
  }

  blur(): Promise<void> {
    return this.page.evaluate(({ index }) => {
      return window.quills[index].blur();
    }, { index: this.index });
  }

  enable(enabled: boolean) {
    return this.page.evaluate(({ index, enabled }) => {
      return window.quills[index].enable(enabled);
    }, { index: this.index, enabled });
  }
}
