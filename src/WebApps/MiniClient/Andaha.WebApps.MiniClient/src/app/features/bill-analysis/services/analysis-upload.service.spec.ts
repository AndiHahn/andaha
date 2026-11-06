import { HttpEventType, HttpRequest, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { Mock } from 'vitest';
import { ContextService } from 'src/app/core/context.service';
import { OnlineStatusService } from 'src/app/core/online-status.service';
import { errorInterceptor } from 'src/app/core/http/error.interceptor';
import { SKIP_GLOBAL_ERROR } from 'src/app/core/http/skip-global-error';
import { compressImage } from 'src/app/shared/utils/image-utils';
import { AnalysisUploadService } from './analysis-upload.service';
import { AnalyzedBillContextService } from './analyzed-bill-context.service';
import { BillContextService } from 'src/app/features/bill/services/bill-context.service';

const isUpload = (r: HttpRequest<unknown>) => r.method === 'POST' && r.url.includes('/upload-for-analysis');
const isPending = (r: HttpRequest<unknown>) => r.method === 'GET' && r.url.includes('/analyzed/pending');
const isToday = (r: HttpRequest<unknown>) => r.method === 'GET' && r.url.includes('/analyzed/today');

function photo(name: string): File {
  // nicht dekodierbar: compressImage gibt die Datei unverändert zurück
  return new File(['not an image'], name, { type: 'image/jpeg' });
}

function pendingRaw(id: string, state: 'queued' | 'analyzing' = 'analyzing') {
  return { id, uploadedAt: '2026-11-06T08:00:00+00:00', state };
}

/** Echte Makrotask (MessageChannel ist nicht gefälscht), damit createImageBitmap & Co. fertig werden */
function nextMacrotask(): Promise<void> {
  return new Promise(resolve => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => resolve();
    channel.port2.postMessage(null);
  });
}

/** Wartet (echte Zeit, höchstens 5 s), bis die nach dem Komprimieren gestarteten Upload-Requests offen sind */
async function waitForUploadRequests(http: HttpTestingController, count: number): Promise<TestRequest[]> {
  const requests: TestRequest[] = [];
  const deadline = performance.now() + 5_000;
  while (requests.length < count && performance.now() < deadline) {
    await nextMacrotask();
    requests.push(...http.match(isUpload));
  }
  expect(requests.length).toBe(count);
  return requests;
}

describe('AnalysisUploadService', () => {
  let service: AnalysisUploadService;
  let http: HttpTestingController;
  let online: WritableSignal<boolean>;
  let openFromComponent: Mock;
  let snackbarAction: Subject<void>;
  let navigateByUrl: Mock;
  let refreshAnalyzed: Mock;
  let refreshBills: Mock;
  let backendReady: BehaviorSubject<boolean>;
  let visibility: DocumentVisibilityState;

  /** Wartet, bis die (nach dem Komprimieren gestarteten) Upload-Requests offen sind */
  function uploadRequests(count: number): Promise<TestRequest[]> {
    return waitForUploadRequests(http, count);
  }

  function accept(request: TestRequest, id: string): void {
    request.flush({ id }, { status: 202, statusText: 'Accepted' });
  }

  function answerPoll(pending: ReturnType<typeof pendingRaw>[], today: unknown[] = []): void {
    http.expectOne(isPending).flush(pending);
    http.expectOne(isToday).flush(today);
  }

  function setVisibility(state: DocumentVisibilityState): void {
    visibility = state;
    document.dispatchEvent(new Event('visibilitychange'));
  }

  function snackbarMessages(): unknown[] {
    return openFromComponent.mock.calls.map(call => call[1].data);
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
    visibility = 'visible';
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);

    online = signal(true);
    snackbarAction = new Subject<void>();
    openFromComponent = vi.fn(() => ({ onAction: () => snackbarAction.asObservable() }));
    navigateByUrl = vi.fn();
    refreshAnalyzed = vi.fn();
    refreshBills = vi.fn();
    backendReady = new BehaviorSubject(false);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OnlineStatusService, useValue: { online } },
        { provide: MatSnackBar, useValue: { openFromComponent } },
        { provide: Router, useValue: { navigateByUrl } },
        { provide: AnalyzedBillContextService, useValue: { refresh: refreshAnalyzed } },
        { provide: BillContextService, useValue: { refreshBills } },
        { provide: ContextService, useValue: { backendReady: () => backendReady } }
      ]
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AnalysisUploadService);
  });

  afterEach(() => {
    try {
      http.verify();
    } finally {
      vi.useRealTimers();
      vi.restoreAllMocks();
    }
  });

  it('sets upload progress from UploadProgress events and links the server id', async () => {
    service.uploadAll([photo('bon.jpg')]);
    const [request] = await uploadRequests(1);

    expect(service.uploads()).toEqual([
      expect.objectContaining({ fileName: 'bon.jpg', state: 'uploading', progress: 0 })
    ]);
    expect(service.uploads()[0].previewUrl).toMatch(/^blob:/);
    expect((request.request.body as FormData).get('file')).toBeInstanceOf(File);

    request.event({ type: HttpEventType.UploadProgress, loaded: 45, total: 100 });
    expect(service.uploads()[0].progress).toBe(45);

    accept(request, 'img-1');
    expect(service.uploads()[0]).toEqual(expect.objectContaining({ state: 'analyzing', serverId: 'img-1' }));
  });

  it('uploads at most 3 at a time', async () => {
    service.uploadAll([photo('1.jpg'), photo('2.jpg'), photo('3.jpg'), photo('4.jpg'), photo('5.jpg')]);
    const first = await uploadRequests(3);
    expect(service.uploads().length).toBe(5);

    accept(first[0], 'img-1');
    const [fourth] = await uploadRequests(1);
    accept(first[1], 'img-2');
    const [fifth] = await uploadRequests(1);

    [first[2], fourth, fifth].forEach((request, index) => accept(request, `img-${index + 3}`));
    expect(service.uploads().map(u => u.state)).toEqual(['analyzing', 'analyzing', 'analyzing', 'analyzing', 'analyzing']);
  });

  it('one failed upload does not stop the others', async () => {
    service.uploadAll([photo('1.jpg'), photo('2.jpg'), photo('3.jpg')]);
    // Komprimieren endet in beliebiger Reihenfolge: Request über den Dateinamen zuordnen
    const requests = await uploadRequests(3);
    const byName = (name: string) => requests.find(r => ((r.request.body as FormData).get('file') as File).name === name)!;

    byName('2.jpg').error(new ProgressEvent('error'));
    accept(byName('1.jpg'), 'img-1');
    accept(byName('3.jpg'), 'img-3');

    expect(service.uploads().map(u => u.state)).toEqual(['analyzing', 'failed', 'analyzing']);
    // nur die Start-Meldung, keine Fehler-Snackbar pro Upload
    expect(snackbarMessages()).toEqual([{ message: '3 Rechnungen werden analysiert', action: 'Anzeigen' }]);
  });

  it('retry re-uploads a failed one', async () => {
    service.uploadAll([photo('bon.jpg')]);
    const [failed] = await uploadRequests(1);
    failed.error(new ProgressEvent('error'));
    const localId = service.uploads()[0].localId;
    expect(service.uploads()[0].state).toBe('failed');

    service.retry(localId);
    expect(service.uploads()[0]).toEqual(expect.objectContaining({ state: 'uploading', progress: 0 }));
    const [again] = await uploadRequests(1);
    accept(again, 'img-1');

    expect(service.uploads()).toEqual([expect.objectContaining({ localId, state: 'analyzing', serverId: 'img-1' })]);
  });

  it('retry re-sends the same id', async () => {
    const uploadId = (request: TestRequest) => (request.request.body as FormData).get('id');

    service.uploadAll([photo('1.jpg'), photo('2.jpg')]);
    const requests = await uploadRequests(2);
    const byName = (name: string) => requests.find(r => ((r.request.body as FormData).get('file') as File).name === name)!;
    const firstId = uploadId(byName('1.jpg'));
    expect(firstId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(uploadId(byName('2.jpg'))).not.toBe(firstId);

    // die Antwort (202) geht verloren: der Server hat das Bild, der Client hält den Upload für gescheitert
    byName('1.jpg').error(new ProgressEvent('error'));
    accept(byName('2.jpg'), 'img-2');
    service.retry(service.uploads()[0].localId);
    const [again] = await uploadRequests(1);

    expect(uploadId(again)).toBe(firstId);
    accept(again, firstId as string);
    expect(service.uploads()[0]).toEqual(expect.objectContaining({ state: 'analyzing', serverId: firstId }));
  });

  it('remove drops a failed upload', async () => {
    service.uploadAll([photo('bon.jpg')]);
    const [failed] = await uploadRequests(1);
    failed.error(new ProgressEvent('error'));

    service.remove(service.uploads()[0].localId);

    expect(service.uploads()).toEqual([]);
    expect(service.inProgressCount()).toBe(0);
  });

  it('polls every 3 s only while work is in progress, every 15 s after 2 min without change', async () => {
    vi.advanceTimersByTime(60_000);
    http.expectNone(isPending);

    service.uploadAll([photo('bon.jpg')]);
    accept((await uploadRequests(1))[0], 'img-1');

    vi.advanceTimersByTime(2_999);
    http.expectNone(isPending);
    vi.advanceTimersByTime(1);
    answerPoll([pendingRaw('img-1')]);
    expect(refreshAnalyzed).toHaveBeenCalledTimes(1);
    expect(refreshAnalyzed).toHaveBeenCalledWith({ silent: true });

    // 2 Minuten lang unverändert: weiter im 3-Sekunden-Takt
    for (let i = 0; i < 40; i++) {
      vi.advanceTimersByTime(3_000);
      answerPoll([pendingRaw('img-1')]);
    }

    // danach nur noch alle 15 Sekunden
    vi.advanceTimersByTime(3_000);
    http.expectNone(isPending);
    vi.advanceTimersByTime(12_000);
    answerPoll([]);

    // nichts mehr in Arbeit: Abfragen hört auf
    expect(service.inProgressCount()).toBe(0);
    vi.advanceTimersByTime(60_000);
    http.expectNone(isPending);
  });

  it('pauses polling while document hidden and refreshes on visible', async () => {
    service.uploadAll([photo('bon.jpg')]);
    accept((await uploadRequests(1))[0], 'img-1');

    setVisibility('hidden');
    vi.advanceTimersByTime(10 * 60_000);
    http.expectNone(isPending);

    setVisibility('visible');
    answerPoll([pendingRaw('img-1')]);

    vi.advanceTimersByTime(3_000);
    answerPoll([pendingRaw('img-1')]);
  });

  it('becoming visible without running work polls once and does not keep polling', () => {
    setVisibility('hidden');
    vi.advanceTimersByTime(10 * 60_000);
    http.expectNone(isPending);

    // z. B. nach Mitternacht oder mit Einträgen vom NAS bzw. einem zweiten Gerät: „Angelegt“ und „In Arbeit“ stimmen wieder
    setVisibility('visible');
    answerPoll([], []);
    expect(refreshAnalyzed).toHaveBeenCalledTimes(1);
    expect(refreshAnalyzed).toHaveBeenCalledWith({ silent: true });

    vi.advanceTimersByTime(60_000);
    http.expectNone(isPending);
  });

  it('completion detected when serverId leaves pending', async () => {
    const completed: { serverId: string }[] = [];
    service.completed$.subscribe(c => completed.push(c));

    service.uploadAll([photo('bon.jpg')]);
    accept((await uploadRequests(1))[0], 'img-1');

    vi.advanceTimersByTime(3_000);
    answerPoll([pendingRaw('img-1')]);
    expect(service.uploads().length).toBe(1);
    expect(completed).toEqual([]);

    vi.advanceTimersByTime(3_000);
    answerPoll([], [{
      billId: 'b1', sourceUploadId: 'img-1', shopName: 'Billa', price: 12.5,
      date: '2026-11-06T00:00:00Z', createdAt: '2026-11-06T08:16:00Z'
    }]);

    expect(service.uploads()).toEqual([]);
    expect(completed).toEqual([{ serverId: 'img-1' }]);
    expect(service.todayCreated()).toEqual([expect.objectContaining({ billId: 'b1', sourceUploadId: 'img-1' })]);
    expect(service.inProgressCount()).toBe(0);
  });

  it('refreshes the bill list once when a new auto-created bill appears', () => {
    const autoCreated = (billId: string) => ({
      billId, sourceUploadId: `img-${billId}`, shopName: 'Billa', price: 12.5,
      date: '2026-11-06T00:00:00Z', createdAt: '2026-11-06T08:16:00Z'
    });

    // erste Abfrage nach dem Start ohne neue Rechnungen: die Liste lädt sich selbst, kein zusätzliches Laden
    backendReady.next(true);
    answerPoll([pendingRaw('img-n1')], []);
    expect(refreshBills).not.toHaveBeenCalled();

    vi.advanceTimersByTime(3_000);
    answerPoll([], [autoCreated('n1')]);
    expect(refreshBills).toHaveBeenCalledTimes(1);

    // dieselben Rechnungen bei der nächsten Abfrage: kein weiteres Laden
    service.refresh();
    answerPoll([], [autoCreated('n1')]);
    expect(refreshBills).toHaveBeenCalledTimes(1);

    // eine weitere neue Rechnung: genau ein weiteres Laden
    service.refresh();
    answerPoll([], [autoCreated('n2'), autoCreated('n1')]);
    expect(refreshBills).toHaveBeenCalledTimes(2);
  });

  it('the first poll after start refreshes the bill list once when it already brings auto-created bills', () => {
    // z. B. auf einem anderen Gerät angelegt: die beim Start geladene Liste (ggf. aus dem SW-Cache) kennt sie evtl. nicht
    backendReady.next(true);
    answerPoll([], [{
      billId: 'other-device', sourceUploadId: 'img-x', shopName: 'Spar', price: 3,
      date: '2026-11-06T00:00:00Z', createdAt: '2026-11-06T07:00:00Z'
    }]);
    expect(refreshBills).toHaveBeenCalledTimes(1);
  });

  it('does not treat an upload as finished by a poll that started before its upload response', async () => {
    service.uploadAll([photo('bon.jpg')]);
    const [request] = await uploadRequests(1);

    vi.advanceTimersByTime(3_000);
    const earlyPoll = http.expectOne(isPending);
    accept(request, 'img-1');
    earlyPoll.flush([]);
    http.expectOne(isToday).flush([]);

    expect(service.uploads()).toEqual([expect.objectContaining({ state: 'analyzing', serverId: 'img-1' })]);

    vi.advanceTimersByTime(3_000);
    answerPoll([]);
    expect(service.uploads()).toEqual([]);
  });

  it('inProgressCount counts local uploads plus server pending without a local counterpart', async () => {
    service.uploadAll([photo('1.jpg'), photo('2.jpg')]);
    const [ok, broken] = await uploadRequests(2);
    accept(ok, 'img-1');
    broken.error(new ProgressEvent('error'));
    expect(service.inProgressCount()).toBe(2);

    vi.advanceTimersByTime(3_000);
    answerPoll([pendingRaw('img-1'), pendingRaw('img-other', 'queued')]);

    expect(service.pending().map(p => p.id)).toEqual(['img-1', 'img-other']);
    expect(service.inProgressCount()).toBe(3);
  });

  it('loads pending and today once the backend is ready', () => {
    backendReady.next(true);
    answerPoll([pendingRaw('img-other')]);

    expect(service.inProgressCount()).toBe(1);
    // die Analyse-Liste lädt ihr eigener Dienst
    expect(refreshAnalyzed).not.toHaveBeenCalled();

    vi.advanceTimersByTime(3_000);
    answerPoll([]);
    vi.advanceTimersByTime(60_000);
    http.expectNone(isPending);
  });

  it('shows the offline snackbar and uploads nothing without connection', async () => {
    online.set(false);

    service.uploadAll([photo('bon.jpg')]);
    await nextMacrotask();

    expect(snackbarMessages()).toEqual(['Ohne Verbindung können keine Rechnungen hochgeladen werden.']);
    expect(service.uploads()).toEqual([]);
    http.expectNone(isUpload);
  });

  it('snackbar text for one bill, action "Anzeigen" opens the analysis tab', async () => {
    service.uploadAll([photo('bon.jpg')]);

    expect(snackbarMessages()).toEqual([{ message: '1 Rechnung wird analysiert', action: 'Anzeigen' }]);
    snackbarAction.next();
    expect(navigateByUrl).toHaveBeenCalledWith('/bill/analysis');

    accept((await uploadRequests(1))[0], 'img-1');
  });

  it('snackbar text for several bills', async () => {
    service.uploadAll([photo('1.jpg'), photo('2.jpg'), photo('3.jpg')]);

    expect(snackbarMessages()).toEqual([{ message: '3 Rechnungen werden analysiert', action: 'Anzeigen' }]);

    (await uploadRequests(3)).forEach((request, index) => accept(request, `img-${index}`));
  });

  it('pauses polling while offline and polls once when back online', async () => {
    service.uploadAll([photo('bon.jpg')]);
    accept((await uploadRequests(1))[0], 'img-1');

    online.set(false);
    TestBed.tick();
    vi.advanceTimersByTime(10 * 60_000);
    http.expectNone(isPending);

    // auch das Zurückkommen in den Vordergrund fragt ohne Verbindung nicht ab
    setVisibility('hidden');
    setVisibility('visible');
    http.expectNone(isPending);

    online.set(true);
    TestBed.tick();
    answerPoll([pendingRaw('img-1')]);

    vi.advanceTimersByTime(3_000);
    answerPoll([pendingRaw('img-1')]);
  });

  it('creates no poll timer after destroy', async () => {
    service.uploadAll([photo('bon.jpg')]);
    accept((await uploadRequests(1))[0], 'img-1');
    vi.advanceTimersByTime(3_000);
    const inFlight = http.expectOne(isPending);

    TestBed.resetTestingModule(); // zerstört den Root-Injector samt Dienst
    expect(vi.getTimerCount()).toBe(0);

    // die noch laufende Abfrage endet nach dem Zerstören: kein neuer Timer
    inFlight.flush([pendingRaw('img-1')]);
    http.match(isToday).forEach(request => request.flush([]));
    expect(vi.getTimerCount()).toBe(0);
  });

  it('compresses with long edge 1600 and quality 0.8 before uploading', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2400;
    canvas.height = 1200;
    const context = canvas.getContext('2d')!;
    const pixels = context.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < pixels.data.length; i++) {
      pixels.data[i] = (i * 7919) % 256; // Muster: JPEG-Größe hängt deutlich von der Qualität ab
    }
    context.putImageData(pixels, 0, 0);
    const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png'));
    const source = new File([blob], 'gross.png', { type: 'image/png' });

    service.uploadAll([source]);
    const [request] = await uploadRequests(1);
    const sent = (request.request.body as FormData).get('file') as File;
    const expected = await compressImage(source, 1600, 0.8);

    expect(sent.type).toBe('image/jpeg');
    const bitmap = await createImageBitmap(sent);
    expect([bitmap.width, bitmap.height]).toEqual([1600, 800]);
    bitmap.close();
    expect(new Uint8Array(await sent.arrayBuffer())).toEqual(new Uint8Array(await expected.arrayBuffer()));

    accept(request, 'img-1');
  });
});

describe('AnalysisUploadService polling with the real analyzed list and error interceptor', () => {
  let http: HttpTestingController;
  let openFromComponent: Mock;

  const isAnalyzedList = (r: HttpRequest<unknown>) => r.method === 'GET' && new URL(r.url).pathname === '/api/bill/analyzed';

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    openFromComponent = vi.fn(() => ({ onAction: () => new Subject<void>() }));

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: OnlineStatusService, useValue: { online: signal(true) } },
        { provide: MatSnackBar, useValue: { openFromComponent } },
        { provide: Router, useValue: { navigateByUrl: vi.fn() } },
        { provide: BillContextService, useValue: { refreshBills: vi.fn() } },
        { provide: ContextService, useValue: { backendUnreachable: () => false, backendReady: () => new BehaviorSubject(false) } }
      ]
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    try {
      http.verify();
    } finally {
      vi.useRealTimers();
      vi.restoreAllMocks();
    }
  });

  it('an analyzed-list request failing with status 0 during a poll shows no global snackbar and no loading state', async () => {
    const analyzedBills = TestBed.inject(AnalyzedBillContextService);
    // der normale (erste) Ladevorgang behält die globale Fehlermeldung
    http.expectOne(isAnalyzedList).error(new ProgressEvent('error'), { status: 0 });
    expect(openFromComponent).toHaveBeenCalledTimes(1);

    const loading: boolean[] = [];
    analyzedBills.loading().subscribe(value => loading.push(value));

    const service = TestBed.inject(AnalysisUploadService);
    service.uploadAll([photo('bon.jpg')]);
    expect(openFromComponent).toHaveBeenCalledTimes(2); // Start-Meldung

    const upload = await waitForUploadRequests(http, 1);
    upload[0].flush({ id: 'img-1' }, { status: 202, statusText: 'Accepted' });

    vi.advanceTimersByTime(3_000);
    http.expectOne(isPending).flush([pendingRaw('img-1')]);
    const listRequest = http.expectOne(isAnalyzedList);
    expect(listRequest.request.context.get(SKIP_GLOBAL_ERROR)).toBe(true);
    listRequest.error(new ProgressEvent('error'), { status: 0 });
    http.expectOne(isToday).flush([]);

    expect(openFromComponent).toHaveBeenCalledTimes(2);
    expect(loading).toEqual([false]);
  });
});
