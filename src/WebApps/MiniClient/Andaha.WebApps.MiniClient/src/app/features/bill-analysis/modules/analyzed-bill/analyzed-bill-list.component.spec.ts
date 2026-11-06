import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { Mock } from 'vitest';
import { AutoCreatedBillDto } from 'src/app/api/shopping/dtos/AutoCreatedBillDto';
import { BillAnalyzedDto } from 'src/app/api/shopping/dtos/BillAnalyzedDto';
import { PendingAnalysisDto } from 'src/app/api/shopping/dtos/PendingAnalysisDto';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { AnalysisUploadService, LocalUpload } from '../../services/analysis-upload.service';
import { AnalyzedBillContextService } from '../../services/analyzed-bill-context.service';
import { AnalyzedBillListComponent } from './analyzed-bill-list.component';

function analyzed(id: string, sourceUploadId?: string): BillAnalyzedDto {
  return { id, shopName: `ZZ Shop ${id}`, price: 12.5, imageAvailable: false, lineItems: [], sourceUploadId };
}

function created(billId: string, sourceUploadId?: string): AutoCreatedBillDto {
  return {
    billId,
    sourceUploadId,
    shopName: `ZZ Markt ${billId}`,
    price: 23.4,
    date: new Date(2026, 10, 6),
    createdAt: new Date()
  };
}

function upload(localId: string, changes: Partial<LocalUpload> = {}): LocalUpload {
  return { localId, previewUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', fileName: `${localId}.jpg`, state: 'uploading', progress: 0, ...changes };
}

describe('AnalyzedBillListComponent', () => {
  let fixture: ComponentFixture<AnalyzedBillListComponent>;
  let host: HTMLElement;
  let uploads: WritableSignal<LocalUpload[]>;
  let pending: WritableSignal<PendingAnalysisDto[]>;
  let today: WritableSignal<AutoCreatedBillDto[]>;
  let completed$: Subject<{ serverId: string }>;
  let bills$: BehaviorSubject<BillAnalyzedDto[]>;
  let loading$: BehaviorSubject<boolean>;
  let failed$: BehaviorSubject<boolean>;
  let retry: Mock;
  let remove: Mock;

  beforeEach(() => {
    localStorage.clear();
    uploads = signal([]);
    pending = signal([]);
    today = signal([]);
    completed$ = new Subject();
    bills$ = new BehaviorSubject<BillAnalyzedDto[]>([]);
    loading$ = new BehaviorSubject(false);
    failed$ = new BehaviorSubject(false);
    retry = vi.fn();
    remove = vi.fn();

    TestBed.configureTestingModule({
      imports: [AnalyzedBillListComponent],
      providers: [
        provideRouter([]),
        {
          provide: AnalysisUploadService,
          useValue: {
            uploads, pending, todayCreated: today, completed$: completed$.asObservable(),
            retry, remove, refresh: vi.fn()
          }
        },
        {
          provide: AnalyzedBillContextService,
          useValue: { bills: () => bills$.asObservable(), loading: () => loading$.asObservable(), failed: () => failed$.asObservable(), refresh: vi.fn() }
        },
        { provide: BillCategoryContextService, useValue: { categories: () => of([]) } }
      ]
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(AnalyzedBillListComponent);
    host = fixture.nativeElement;
    // die Seite füllt im App-Layout die Höhe der .area; der virtuelle Scroll braucht eine Höhe
    host.style.height = '800px';
    await settle();
  }

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function sections(): string[] {
    return Array.from(host.querySelectorAll('.sec[role="heading"]')).map(h => h.textContent!.trim());
  }

  function button(row: Element, text: string): HTMLButtonElement {
    const found = Array.from(row.querySelectorAll<HTMLButtonElement>('button')).find(b => b.textContent?.includes(text));
    expect(found, `Button „${text}“`).toBeTruthy();
    return found!;
  }

  it('shows three sections only when non-empty', async () => {
    uploads.set([upload('l1')]);
    bills$.next([analyzed('a1')]);
    today.set([created('b1')]);
    await render();

    expect(sections()).toEqual(['In Arbeit', 'Zu prüfen', 'Angelegt']);
    expect(host.querySelectorAll('app-in-progress-row').length).toBe(1);
    expect(host.querySelectorAll('app-analyzed-bill-list-item').length).toBe(1);
    expect(host.querySelectorAll('app-created-row').length).toBe(1);

    uploads.set([]);
    today.set([]);
    await settle();

    expect(sections()).toEqual(['Zu prüfen']);
  });

  it('in-progress row shows upload percent and analyzing bar', async () => {
    uploads.set([
      upload('l1', { progress: 45 }),
      upload('l2', { state: 'analyzing', progress: 100, serverId: 's2' })
    ]);
    pending.set([{ id: 's2', uploadedAt: new Date(), state: 'analyzing' }]);
    await render();

    const rows = Array.from(host.querySelectorAll('app-in-progress-row'));
    expect(rows.length).toBe(2);

    expect(rows[0].textContent).toContain('Wird hochgeladen · 45 %');
    const uploadBar = rows[0].querySelector('mat-progress-bar')!;
    expect(uploadBar.getAttribute('mode')).toBe('determinate');
    expect(uploadBar.getAttribute('aria-valuenow')).toBe('45');
    expect(rows[0].querySelector('img')).not.toBeNull();

    expect(rows[1].textContent).toContain('Wird analysiert …');
    expect(rows[1].querySelector('mat-progress-bar')!.getAttribute('mode')).toBe('indeterminate');
    expect(rows[1].textContent).not.toContain('dauert länger als üblich');
  });

  it('long analysis shows "dauert länger als üblich"', async () => {
    // Server-Eintrag ohne lokalen Upload (anderes Gerät, nach Neuladen): Belegsymbol, „seit“ aus uploadedAt
    pending.set([
      { id: 's1', uploadedAt: new Date(Date.now() - 3 * 60_000), state: 'analyzing' },
      { id: 's2', uploadedAt: new Date(Date.now() - 30_000), state: 'queued' }
    ]);
    await render();

    const rows = Array.from(host.querySelectorAll('app-in-progress-row'));
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Wird analysiert …');
    expect(rows[0].textContent).toContain('dauert länger als üblich');
    expect(rows[0].querySelector('img')).toBeNull();
    expect(rows[0].querySelector('mat-icon')!.textContent).toContain('receipt_long');
    expect(rows[1].textContent).toContain('Wird analysiert …');
    expect(rows[1].textContent).not.toContain('dauert länger als üblich');
  });

  it('local upload with a server entry is listed once', async () => {
    uploads.set([upload('l1', { state: 'analyzing', progress: 100, serverId: 's1' })]);
    pending.set([{ id: 's1', uploadedAt: new Date(Date.now() - 3 * 60_000), state: 'analyzing' }]);
    await render();

    const rows = Array.from(host.querySelectorAll('app-in-progress-row'));
    expect(rows.length).toBe(1);
    expect(rows[0].querySelector('img')).not.toBeNull();
    expect(rows[0].textContent).toContain('dauert länger als üblich');
  });

  it('failed upload offers retry and remove', async () => {
    uploads.set([upload('l1', { state: 'failed' })]);
    await render();

    const row = host.querySelector('app-in-progress-row')!;
    expect(row.textContent).toContain('Upload fehlgeschlagen');
    expect(row.querySelector('mat-progress-bar')).toBeNull();

    button(row, 'Erneut versuchen').click();
    expect(retry).toHaveBeenCalledWith('l1');

    button(row, 'Entfernen').click();
    expect(remove).toHaveBeenCalledWith('l1');
  });

  it('created row opens bill and Erledigt hides it (persisted per day)', async () => {
    today.set([created('b1'), created('b2')]);
    await render();

    let rows = Array.from(host.querySelectorAll('app-created-row'));
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('ZZ Markt b1');
    expect(rows[0].textContent).toContain('23,40');
    expect(rows[0].querySelector('mat-icon')!.textContent).toContain('auto_awesome');
    expect(rows[0].textContent).toContain('automatisch angelegt');
    expect(rows[0].textContent).toContain('06');
    expect(rows[0].querySelector('a')!.getAttribute('href')).toBe('/bill/b1');

    button(rows[0], 'Erledigt').click();
    await settle();

    rows = Array.from(host.querySelectorAll('app-created-row'));
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('ZZ Markt b2');

    // neu geöffnet (gleicher Tag): bleibt ausgeblendet
    fixture.destroy();
    await render();
    rows = Array.from(host.querySelectorAll('app-created-row'));
    expect(rows.map(r => r.textContent)).toEqual([expect.stringContaining('ZZ Markt b2')]);

    // alles erledigt: Abschnitt verschwindet
    button(rows[0], 'Erledigt').click();
    await settle();
    expect(sections()).toEqual([]);
  });

  it('finished upload highlights its result via sourceUploadId', async () => {
    bills$.next([analyzed('a0', 'u0')]);
    today.set([created('b0', 'u9')]);
    await render();

    // fertig gemeldet, bevor die Analyse-Liste den Eintrag enthält
    completed$.next({ serverId: 'u1' });
    completed$.next({ serverId: 'u2' });
    await settle();
    expect(host.querySelector('.is-new')).toBeNull();

    bills$.next([analyzed('a0', 'u0'), analyzed('a1', 'u1')]);
    today.set([created('b0', 'u9'), created('b2', 'u2')]);
    await settle();

    const reviewRows = Array.from(host.querySelectorAll('app-analyzed-bill-list-item'));
    expect(reviewRows.map(r => r.querySelector('.row')!.classList.contains('is-new'))).toEqual([false, true]);
    const createdRows = Array.from(host.querySelectorAll('app-created-row'));
    expect(createdRows.map(r => r.querySelector('.row')!.classList.contains('is-new'))).toEqual([false, true]);
  });

  it('highlights a result that is already listed when the upload finishes', async () => {
    bills$.next([analyzed('a1', 'u1')]);
    await render();

    completed$.next({ serverId: 'u1' });
    await settle();

    expect(host.querySelector('app-analyzed-bill-list-item .row')!.classList).toContain('is-new');
  });

  it('empty state text', async () => {
    await render();

    expect(sections()).toEqual([]);
    expect(host.querySelector('app-load-state')!.textContent!.trim())
      .toBe('Keine Analysen – fotografiere Rechnungen mit dem Kamera-Knopf.');
  });

  it('shows loading and error through app-load-state', async () => {
    loading$.next(true);
    await render();
    expect(host.querySelector('app-load-state mat-progress-bar')).not.toBeNull();

    loading$.next(false);
    failed$.next(true);
    await settle();
    expect(host.querySelector('app-load-state [role="alert"]')!.textContent).toContain('Laden fehlgeschlagen');
  });
});
