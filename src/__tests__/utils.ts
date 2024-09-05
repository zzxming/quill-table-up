import { expect } from 'vitest';
import Quill from 'quill';
import TableUp from '../index';

// eslint-disable-next-line unicorn/prefer-string-replace-all
export const normalizeHTML = (html: string | { html: string }) => typeof html === 'object' ? html.html : html.replace(/\n\s*/g, '');
export const sortAttributes = (element: HTMLElement) => {
  const attributes = Array.from(element.attributes);
  const sortedAttributes = attributes.sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  while (element.attributes.length > 0) {
    element.removeAttribute(element.attributes[0].name);
  }

  for (const attr of sortedAttributes) {
    element.setAttribute(attr.name, attr.value);
  }

  // eslint-disable-next-line unicorn/no-array-for-each
  element.childNodes.forEach((child) => {
    if (child instanceof HTMLElement) {
      sortAttributes(child);
    }
  });
};
export const createQuillWithTableModule = (html: string, options = true, register = {}) => {
  Quill.register({
    'modules/tableUp': TableUp,
    ...register,
  }, true);
  const container = document.body.appendChild(document.createElement('div'));
  container.innerHTML = normalizeHTML(html);
  const quill = new Quill(container, {
    modules: { tableUp: options },
  });
  return quill;
};

expect.extend({
  toEqualHTML(received, expected, options = {}) {
    const ignoreAttrs = options?.ignoreAttrs ?? [];
    const receivedDOM = document.createElement('div');
    const expectedDOM = document.createElement('div');
    receivedDOM.innerHTML = normalizeHTML(
      typeof received === 'string' ? received : received.innerHTML,
    );
    expectedDOM.innerHTML = normalizeHTML(expected);

    const doms = [receivedDOM, expectedDOM];

    for (const dom of doms) {
      for (const node of Array.from(dom.querySelectorAll('.ql-ui'))) {
        node.remove();
      }

      for (const attr of ignoreAttrs) {
        for (const node of Array.from(dom.querySelectorAll(`[${attr}]`))) {
          node.removeAttribute(attr);
        }
      }

      sortAttributes(dom);
    }

    if (this.equals(receivedDOM.innerHTML, expectedDOM.innerHTML)) {
      return { pass: true, message: () => '' };
    }
    return {
      pass: false,
      message: () =>
        `HTMLs don't match.\n${this.utils.diff(
          this.utils.stringify(receivedDOM),
          this.utils.stringify(expectedDOM),
        )}`,
    };
  },
});
