export const isFunction = (val: any): val is Function => typeof val === 'function';
export const isBoolean = (val: any): val is boolean => typeof val === 'boolean';
export const isArray = Array.isArray;
export const isString = (val: any): val is string => typeof val === 'string';
export const isObject = (val: any): val is Record<any, any> => val !== null && typeof val === 'object';
export const isValidCellspan = (val: any): boolean => !Number.isNaN(val) && Number(val) > 0;
