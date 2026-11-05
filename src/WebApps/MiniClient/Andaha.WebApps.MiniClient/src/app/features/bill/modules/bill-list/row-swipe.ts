/** Ergebnis einer Wischgeste auf einer Rechnungszeile (design.md §3.1, AC3) */
export type RowSwipeResult = 'delete' | 'duplicate' | 'open-delete' | 'open-duplicate';

/** Nur fast waagrechte Gesten zählen (wie beim Tab-Wischen): unter 30° zur Waagrechten */
export const ROW_SWIPE_MAX_ANGLE = 30;
/** Kürzere Gesten sind ein Tipp oder ein Zittern */
export const ROW_SWIPE_MIN_DISTANCE = 24;
/** Ab diesem Anteil der Zeilenbreite löst die Aktion direkt aus, darunter bleibt die Zeile offen */
export const ROW_SWIPE_ACTION_RATIO = 0.4;
/** Breite der aufgedeckten Aktion im Offen-Zustand (Mockup 01 A) */
export const ROW_SWIPE_OPEN_WIDTH = 96;

/** Links wischen heißt Löschen, rechts wischen Duplizieren; null, wenn die Geste nicht zählt */
export function evaluateRowSwipe(dx: number, dy: number, rowWidth: number): RowSwipeResult | null {
  if (isSteep(dx, dy) || Math.abs(dx) < ROW_SWIPE_MIN_DISTANCE) {
    return null;
  }

  const action = Math.abs(dx) >= ROW_SWIPE_ACTION_RATIO * rowWidth;
  if (dx < 0) {
    return action ? 'delete' : 'open-delete';
  }
  return action ? 'duplicate' : 'open-duplicate';
}

/** true, wenn die Bewegung 30° oder steiler zur Waagrechten verläuft */
export function isSteep(dx: number, dy: number): boolean {
  return Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI >= ROW_SWIPE_MAX_ANGLE;
}
