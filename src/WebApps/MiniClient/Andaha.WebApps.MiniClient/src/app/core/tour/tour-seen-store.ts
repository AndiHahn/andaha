export const TOUR_SEEN_KEY = 'andaha.tour.v1.seen';

/** Merkt pro Gerät, dass die Schnellhilfe-Tour schon gezeigt wurde (localStorage). */
export class TourSeenStore {
  /** Getter, damit auch ein werfender Zugriff auf `localStorage` abgefangen wird */
  constructor(private readonly storage: () => Storage) {}

  /** `true`, wenn gesehen ODER der Speicher unbrauchbar ist (dann nie automatisch starten) */
  isSeenOrUnavailable(): boolean {
    try {
      return this.storage().getItem(TOUR_SEEN_KEY) === '1';
    } catch {
      return true;
    }
  }

  markSeen(): void {
    try {
      this.storage().setItem(TOUR_SEEN_KEY, '1');
    } catch {
      // Speicher nicht verfügbar: dann startet die Tour ohnehin nie automatisch
    }
  }
}
