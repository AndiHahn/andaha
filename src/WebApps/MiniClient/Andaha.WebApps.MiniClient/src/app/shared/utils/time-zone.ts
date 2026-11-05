/** Fallback des Backends, wenn der Browser keine IANA-Zeitzone liefert */
const DEFAULT_TIME_ZONE = 'Europe/Vienna';

/**
 * IANA-Zeitzone des Geräts (z. B. "Europe/Vienna"). Die Monats-Endpoints der Arbeitszeiten teilen
 * Einträge damit nach lokalen Monaten ein (Parameter `tz`).
 */
export function currentTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIME_ZONE;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}
