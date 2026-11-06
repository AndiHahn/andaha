import { Injectable, signal } from '@angular/core';

const KEY_PREFIX = 'andaha.analysis.ack.';

/** `localStorage`-Schlüssel der erledigten Einträge eines (lokalen) Tages: `andaha.analysis.ack.<yyyy-MM-dd>` */
export function acknowledgedKey(day: Date): string {
  const month = String(day.getMonth() + 1).padStart(2, '0');
  const date = String(day.getDate()).padStart(2, '0');
  return `${KEY_PREFIX}${day.getFullYear()}-${month}-${date}`;
}

/**
 * „Erledigt“ im Abschnitt „Angelegt“ (US-0009 design.md §4): nur auf diesem Gerät und nur für heute, ohne Backend.
 * Einträge früherer Tage werden beim Start entfernt; nach Mitternacht gilt automatisch der neue (leere) Tag.
 */
@Injectable({ providedIn: 'root' })
export class AcknowledgedStore {
  /** Ändert sich bei jedem `acknowledge`, damit Signale, die `isAcknowledged` lesen, neu rechnen */
  private readonly version = signal(0);

  constructor() {
    this.removeEarlierDays();
  }

  isAcknowledged(billId: string): boolean {
    this.version();
    return this.read(acknowledgedKey(new Date())).includes(billId);
  }

  acknowledge(billId: string): void {
    const key = acknowledgedKey(new Date());
    const ids = this.read(key);
    if (!ids.includes(billId)) {
      try {
        localStorage.setItem(key, JSON.stringify([...ids, billId]));
      } catch {
        // Speicher voll oder gesperrt: dann bleibt der Eintrag sichtbar
      }
    }
    this.version.update(v => v + 1);
  }

  private read(key: string): string[] {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
      return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : [];
    } catch {
      return [];
    }
  }

  private removeEarlierDays(): void {
    const todayKey = acknowledgedKey(new Date());
    try {
      const outdated: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(KEY_PREFIX) && key !== todayKey) {
          outdated.push(key);
        }
      }
      outdated.forEach(key => localStorage.removeItem(key));
    } catch {
      // ohne Zugriff auf localStorage gibt es nichts aufzuräumen
    }
  }
}
