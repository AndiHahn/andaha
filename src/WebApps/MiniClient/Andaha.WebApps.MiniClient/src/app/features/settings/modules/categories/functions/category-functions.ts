/** Farbpalette fuer Kategorien (Mockup 03 A): 18 Hex-Werte, auf --bg unterscheidbar. Kleinbuchstaben, damit Vergleiche stimmen. */
export const CATEGORY_COLORS: readonly string[] = [
  '#3b7d4f', '#2e4fa8', '#b5651d', '#8e5ba8', '#b63a3a', '#c9a227',
  '#2a8c8c', '#5a6b7d', '#d46a8c', '#7a8f3a', '#8b5e3c', '#4a90c2',
  '#e08a3c', '#6b4fa0', '#3e9e6e', '#a0968a', '#1e1913', '#9b2c6f'
];

export function isKnownCategoryColor(color: string): boolean {
  return CATEGORY_COLORS.includes(color.toLowerCase());
}
