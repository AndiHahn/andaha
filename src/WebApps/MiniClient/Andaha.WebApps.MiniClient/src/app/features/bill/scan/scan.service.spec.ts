import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, provideRouter } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { AnalyzeBillResultDto } from 'src/app/api/shopping/dtos/AnalyzeBillResultDto';
import { BillCreatePrefill } from '../models/bill-create-prefill';
import { PrefillImageStore } from '../services/prefill-image-store.service';
import { SCAN_TIMEOUT_MS, ScanService, mapAnalyzeResultToPrefill } from './scan.service';

async function png(width: number, height: number): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.fillRect(0, 0, width, height);
  const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png'));
  return new File([blob], 'photo.png', { type: 'image/png' });
}

const fullResult: AnalyzeBillResultDto = {
  shopName: 'Billa',
  date: '2026-11-03T00:00:00',
  totalAmount: 42.9,
  categoryId: 'c1',
  subCategoryId: 's1',
  confidence: 0.9,
  lineItems: []
};

/** Ein Blob im History-State ist nach einer Traversierung in Chromium nicht mehr lesbar (Phase 4 F1/F2) */
function containsBlob(value: unknown): boolean {
  if (value instanceof Blob) {
    return true;
  }
  return !!value && typeof value === 'object' && Object.values(value).some(containsBlob);
}

describe('mapAnalyzeResultToPrefill', () => {
  const imageKey = 'key-1';

  it('übernimmt alle Felder, Datum als ISO-Tag', () => {
    expect(mapAnalyzeResultToPrefill(fullResult, imageKey)).toEqual({
      imageKey,
      shopName: 'Billa',
      date: '2026-11-03',
      price: 42.9,
      categoryId: 'c1',
      subCategoryId: 's1'
    });
  });

  it('nimmt den Kalendertag auch aus einem Zeitstempel mit Zone', () => {
    expect(mapAnalyzeResultToPrefill({ ...fullResult, date: '2026-10-31T23:30:00+01:00' }, imageKey).date).toBe('2026-10-31');
  });

  it('lässt fehlende Felder undefined', () => {
    const prefill = mapAnalyzeResultToPrefill({ shopName: null, date: null, totalAmount: null, categoryId: null, subCategoryId: 's1', lineItems: [] }, imageKey);

    expect(prefill.imageKey).toBe(imageKey);
    expect(prefill.shopName).toBeUndefined();
    expect(prefill.date).toBeUndefined();
    expect(prefill.price).toBeUndefined();
    expect(prefill.categoryId).toBeUndefined();
    expect(prefill.subCategoryId).toBeUndefined();
    expect(prefill.notice).toBeUndefined();
  });

  it('ignoriert leeren Shopnamen und ungültiges Datum', () => {
    const prefill = mapAnalyzeResultToPrefill({ ...fullResult, shopName: '  ', date: 'kein Datum' }, imageKey);

    expect(prefill.shopName).toBeUndefined();
    expect(prefill.date).toBeUndefined();
  });
});

describe('ScanService', () => {
  let service: ScanService;
  let navigate: ReturnType<typeof vi.spyOn>;
  let analyzeBill: ReturnType<typeof vi.fn>;
  let openDialog: ReturnType<typeof vi.fn>;
  let closeDialog: ReturnType<typeof vi.fn>;
  let openSnackbar: ReturnType<typeof vi.spyOn>;
  let afterClosed: Subject<unknown>;
  let response: Subject<AnalyzeBillResultDto>;
  let unsubscribed: boolean;

  beforeEach(() => {
    unsubscribed = false;
    response = new Subject<AnalyzeBillResultDto>();
    afterClosed = new Subject<unknown>();
    analyzeBill = vi.fn(() => new Observable<AnalyzeBillResultDto>(subscriber => {
      const inner = response.subscribe(subscriber);
      return () => {
        unsubscribed = true;
        inner.unsubscribe();
      };
    }));
    closeDialog = vi.fn(() => {
      afterClosed.next(undefined);
      afterClosed.complete();
    });
    openDialog = vi.fn(() => ({ afterClosed: () => afterClosed.asObservable(), close: closeDialog }));

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: BillApiService, useValue: { analyzeBill } },
        { provide: MatDialog, useValue: { open: openDialog } }
      ]
    });

    service = TestBed.inject(ScanService);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    openSnackbar = vi.spyOn(TestBed.inject(MatSnackBar), 'openFromComponent').mockReturnValue(undefined as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function navigatedPrefill(): BillCreatePrefill {
    expect(navigate).toHaveBeenCalledTimes(1);
    const [commands, extras] = navigate.mock.calls[0] as [unknown[], { state: { prefill: BillCreatePrefill } }];
    expect(commands).toEqual(['/bill/create']);
    // das Foto liegt nicht im History-State (Chromium verliert sonst den ganzen Zustand des Eintrags)
    expect(containsBlob(extras.state)).toBe(false);
    return extras.state.prefill;
  }

  /** Foto, das der Scan dem Formular übergeben hat (im Speicher, Schlüssel im Router-State) */
  function handedOverImage(prefill: BillCreatePrefill): File | null {
    return TestBed.inject(PrefillImageStore).get(prefill.imageKey);
  }

  async function analyzing(): Promise<void> {
    await vi.waitFor(() => expect(analyzeBill).toHaveBeenCalled());
  }

  it('Erfolg: Overlay mit verkleinertem Foto, dann Formular mit Feldern und Foto', async () => {
    const done = service.start(await png(2000, 1000));
    await analyzing();

    const sent = analyzeBill.mock.calls[0][0] as File;
    expect(sent.type).toBe('image/jpeg');
    expect(openDialog).toHaveBeenCalledTimes(1);
    expect((openDialog.mock.calls[0][1] as { data: { image: File } }).data.image).toBe(sent);

    response.next(fullResult);
    response.complete();
    await done;

    expect(closeDialog).toHaveBeenCalled();
    // Overlay zu, bevor navigiert wird (closeOnNavigation: false)
    expect(closeDialog.mock.invocationCallOrder[0]).toBeLessThan(navigate.mock.invocationCallOrder[0]);
    const prefill = navigatedPrefill();
    expect(prefill).toEqual({
      imageKey: expect.any(String), shopName: 'Billa', date: '2026-11-03', price: 42.9, categoryId: 'c1', subCategoryId: 's1'
    });
    expect(handedOverImage(prefill)).toBe(sent);
  });

  it('Erfolg ohne ein einziges Feld: nur Foto und Hinweis', async () => {
    const done = service.start(await png(20, 20));
    await analyzing();

    response.next({ lineItems: [] });
    response.complete();
    await done;

    const prefill = navigatedPrefill();
    expect(prefill.notice).toBe('analysis-failed');
    expect(handedOverImage(prefill)).toBeInstanceOf(File);
    expect(prefill.shopName).toBeUndefined();
  });

  it('Fehler: Formular mit Foto und Hinweis', async () => {
    const done = service.start(await png(20, 20));
    await analyzing();

    response.error(new Error('500'));
    await done;

    expect(closeDialog).toHaveBeenCalled();
    const prefill = navigatedPrefill();
    expect(prefill).toEqual({ imageKey: expect.any(String), notice: 'analysis-failed' });
    expect(handedOverImage(prefill)).toBe(analyzeBill.mock.calls[0][0]);
  });

  it('Zeitüberschreitung nach 30 s: Hinweis, Request abbestellt', async () => {
    const photo = await png(20, 20);
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
    const done = service.start(photo);
    await analyzing();

    vi.advanceTimersByTime(SCAN_TIMEOUT_MS - 1);
    expect(navigate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    await done;

    expect(unsubscribed).toBe(true);
    expect(closeDialog).toHaveBeenCalled();
    expect(navigatedPrefill().notice).toBe('analysis-failed');
  });

  it('Abbrechen: Request abbestellt, Formular nur mit Foto, ohne Hinweis', async () => {
    const done = service.start(await png(20, 20));
    await analyzing();

    // „Abbrechen“ bzw. Zurück schließen das Overlay
    afterClosed.next(undefined);
    afterClosed.complete();
    await done;

    expect(unsubscribed).toBe(true);
    const prefill = navigatedPrefill();
    expect(prefill).toEqual({ imageKey: expect.any(String) });
    expect(handedOverImage(prefill)).toBe(analyzeBill.mock.calls[0][0]);
  });

  it('ohne Netz: gleich das Formular mit Foto und Hinweis, kein Overlay', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    await service.start(await png(20, 20));

    expect(analyzeBill).not.toHaveBeenCalled();
    expect(openDialog).not.toHaveBeenCalled();
    const prefill = navigatedPrefill();
    expect(prefill.notice).toBe('analysis-failed');
    expect(handedOverImage(prefill)).toBeInstanceOf(File);
  });

  it('kein Bild: Fehlermeldung, keine Analyse, keine Navigation', async () => {
    await service.start(new File(['kein Bild'], 'notes.txt', { type: 'text/plain' }));

    expect(openSnackbar).toHaveBeenCalled();
    expect(analyzeBill).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('zweiter Start während eines laufenden Scans wird ignoriert', async () => {
    const photo = await png(20, 20);
    const first = service.start(photo);
    await service.start(photo);
    await analyzing();

    expect(openDialog).toHaveBeenCalledTimes(1);
    expect(analyzeBill).toHaveBeenCalledTimes(1);

    response.next(fullResult);
    response.complete();
    await first;

    // danach geht ein neuer Scan wieder
    response = new Subject<AnalyzeBillResultDto>();
    afterClosed = new Subject<unknown>();
    const second = service.start(photo);
    await vi.waitFor(() => expect(analyzeBill).toHaveBeenCalledTimes(2));
    response.error(new Error('500'));
    await second;
    expect(navigate).toHaveBeenCalledTimes(2);
  });
});
