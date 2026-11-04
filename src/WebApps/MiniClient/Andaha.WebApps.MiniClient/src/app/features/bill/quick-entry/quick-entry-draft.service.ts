import { Injectable, inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { QuickEntryDraft, QuickEntryDraftStore } from './logic/draft-store';

/**
 * Entwurf der Schnellerfassung (AC18) für den angemeldeten Benutzer, in `localStorage`.
 * Ohne Benutzer (noch nicht angemeldet) wird nichts gespeichert.
 */
@Injectable({ providedIn: 'root' })
export class QuickEntryDraftService {
  private readonly oauth = inject(OAuthService);
  private readonly store = new QuickEntryDraftStore(localStorage, () => Date.now());

  load(): QuickEntryDraft | null {
    const userId = this.userId();
    return userId ? this.store.load(userId) : null;
  }

  save(draft: Omit<QuickEntryDraft, 'savedAt'>): void {
    const userId = this.userId();
    if (userId) {
      this.store.save(userId, draft);
    }
  }

  clear(): void {
    const userId = this.userId();
    if (userId) {
      this.store.clear(userId);
    }
  }

  private userId(): string | null {
    const claims = this.oauth.getIdentityClaims() as Record<string, unknown> | null;
    const id = claims?.['sub'] ?? claims?.['oid'];
    return typeof id === 'string' && id ? id : null;
  }
}
