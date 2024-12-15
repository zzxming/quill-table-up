/* eslint-disable ts/no-empty-object-type */
/* eslint-disable unused-imports/no-unused-imports */
import type { Assertion, AsymmetricMatchersContaining } from 'vitest';

interface CustomMatchers<R = unknown> {
  toEqualHTML: (html: string, options?: { ignoreAttrs?: string[] }) => R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
