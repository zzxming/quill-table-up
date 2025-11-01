export const isFunction = (val: unknown): val is Function => typeof val === 'function';
export const isBoolean = (val: unknown): val is boolean => typeof val === 'boolean';
export const isArray = Array.isArray;
export const isString = (val: unknown): val is string => typeof val === 'string';
export const isNumber = (val: unknown): val is number => typeof val === 'number';
export const isObject = (val: unknown): val is Record<any, any> => val !== null && typeof val === 'object';
export const isUndefined = (val: unknown): val is undefined => val === undefined;
export const isValidCellspan = (val: unknown): boolean => !Number.isNaN(val) && Number(val) > 0;
export const ensureArray = <T>(val: T | T[]): T[] => isArray(val) ? val : [val];
