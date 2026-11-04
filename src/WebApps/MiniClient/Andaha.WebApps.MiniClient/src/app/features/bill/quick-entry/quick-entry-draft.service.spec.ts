import { TestBed } from '@angular/core/testing';
import { OAuthService } from 'angular-oauth2-oidc';
import { QuickEntryDraftService } from './quick-entry-draft.service';

describe('QuickEntryDraftService', () => {
  let claims: Record<string, unknown> | null;

  beforeEach(() => {
    claims = { sub: 'user-1' };
    localStorage.removeItem('andaha.quickEntryDraft.user-1');
    localStorage.removeItem('andaha.quickEntryDraft.user-2');
    TestBed.configureTestingModule({
      providers: [{ provide: OAuthService, useValue: { getIdentityClaims: () => claims } }]
    });
  });

  afterEach(() => {
    localStorage.removeItem('andaha.quickEntryDraft.user-1');
    localStorage.removeItem('andaha.quickEntryDraft.user-2');
  });

  const draft = { amountText: '6,8', tileKey: null, shopName: null, categoryId: null, subCategoryId: null, date: '2026-11-03' };

  it('keeps the draft per user', () => {
    const service = TestBed.inject(QuickEntryDraftService);
    service.save(draft);
    expect(service.load()).toEqual(expect.objectContaining(draft));

    claims = { sub: 'user-2' };
    expect(service.load()).toBeNull();
  });

  it('clear removes the draft', () => {
    const service = TestBed.inject(QuickEntryDraftService);
    service.save(draft);
    service.clear();
    expect(service.load()).toBeNull();
  });

  it('does nothing without a signed-in user', () => {
    claims = null;
    const service = TestBed.inject(QuickEntryDraftService);
    service.save(draft);
    expect(service.load()).toBeNull();
  });
});
