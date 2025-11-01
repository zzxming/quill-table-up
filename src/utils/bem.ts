import { cssNamespace } from './constants';

export function createBEM(b: string, n: string = cssNamespace) {
  const prefix = n ? `${n}-` : '';
  return {
    /** n-b */
    b: () => `${prefix}${b}`,
    /** n-b__e */
    be: (e?: string) => e ? `${prefix}${b}__${e}` : '',
    /** n-b--m */
    bm: (m?: string) => m ? `${prefix}${b}--${m}` : '',
    /** n-b__e--m */
    bem: (e?: string, m?: string) => e && m ? `${prefix}${b}__${e}--${m}` : '',
    /** n-s */
    ns: (s?: string) => s ? `${prefix}${s}` : '',
    /** n-b-s */
    bs: (s?: string) => s ? `${prefix}${b}-${s}` : '',
    /** --n-v */
    cv: (v?: string) => v ? `--${prefix}${v}` : '',
    /** is-n */
    is: (n: string) => `is-${n}`,
  };
}
