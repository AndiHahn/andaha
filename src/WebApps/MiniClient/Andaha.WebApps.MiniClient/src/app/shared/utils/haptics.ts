export function vibrate(ms = 30): void {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // Haptik ist nur ein Zusatz
  }
}
