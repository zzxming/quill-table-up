export function toKebabCase(key: string) {
  const result = key.replaceAll(/([A-Z])/g, ' $1').trim();
  return result.split(' ').join('-').toLowerCase();
}

export function toCamelCase(key: string) {
  return key.replaceAll(/-(\w)/g, (all, letter) => {
    return letter.toUpperCase();
  });
}
