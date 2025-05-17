export function cssTextToObject(cssText: string): Record<string, string> {
  const styleObject: Record<string, string> = {};

  const styles = cssText.trim().split(';');

  for (let i = 0; i < styles.length; i++) {
    const style = styles[i].trim();
    if (!style) continue;

    const colonPosition = style.indexOf(':');
    if (colonPosition === -1) continue;

    const property = style.slice(0, Math.max(0, colonPosition)).trim();
    const value = style.slice(Math.max(0, colonPosition + 1)).trim();
    styleObject[toCamelCase(property)] = value;
  }

  return styleObject;
}
export function objectToCssText(obj: Record<string, any>): string {
  return Object.entries(obj)
    .map(([key, value]) => `${toKebabCase(key)}: ${value};`)
    .join(' ');
}

export function toKebabCase(key: string) {
  const result = key.replaceAll(/([A-Z])/g, ' $1').trim();
  return result.split(' ').join('-').toLowerCase();
}

export function toCamelCase(key: string) {
  return key.replaceAll(/-(\w)/g, (all, letter) => {
    return letter.toUpperCase();
  });
}
