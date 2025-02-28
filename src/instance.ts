import type Quill from 'quill';

const mock = {
  Quill: {
    import(_path: string) {
      return class {};
    },

    register() {},
  } as unknown as typeof Quill,
};

export function getQuill() {
  return mock.Quill;
}
export function setQuill(value: typeof Quill) {
  mock.Quill = value;
}

export type { Quill as TypeQuill };
