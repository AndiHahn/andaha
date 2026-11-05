import { HttpEventType, HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { Mock } from 'vitest';
import { ContextService } from 'src/app/core/context.service';
import { OnlineStatusService } from 'src/app/core/online-status.service';
import { AnalysisUploadService } from './analysis-upload.service';
import { AnalyzedBillContextService } from './analyzed-bill-context.service';

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

describe('AnalysisUploadService', () => {
  let service: AnalysisUploadService;
  let http: HttpTestingController;
  let online: WritableSignal<boolean>;
  let openFromComponent: Mock;
  let snackbarAction: Subject<void>;
  let navigateByUrl: Mock;
  let refreshAnalyzed: Mock;
  let backendReady: BehaviorSubject<boolean>;
  let visibility: DocumentVisibilityState;

  /** Wartet, bis die (nach dem Komprimieren gestarteten) Upload-Requests offen sind */
  async function uploadRequests(count: number): Promise<TestRequest[]> {
    const requests: TestRequest[] = [];
    for (let i = 0; i < 200 && requests.length < count; i++) {
      await nextMacrotask();
      requests.push(...http.match(isUpload));
    }
    expect(requests.length).toBe(count);
    return requests;
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
    backendReady = new BehaviorSubject(false);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OnlineStatusService, useValue: { online } },
        { provide: MatSnackBar, useValue: { openFromComponent } },
        { provide: Router, useValue: { navigateByUrl } },
        { provide: AnalyzedBillContextService, useValue: { refresh: refreshAnalyzed } },
        { provide: ContextService, useValue: { backendReady: () => backendReady } }
      ]
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AnalysisUploadService);
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
    vi.restoreAllMocks();
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
});
