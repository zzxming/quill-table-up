/* eslint-disable unused-imports/no-unused-imports */
import type { Assertion, AsymmetricMatchersContaining } from 'vitest';

interface CustomMatchers<R = unknown> {
  toEqualHTML: (html: string, options?: {
    ignoreAttrs?: string[];
    replaceAttrs?: Record<string, (attrValue: string) => string>;
  }) => R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
