import { TestBed } from '@angular/core/testing';
import { NavigationBehaviorOptions, NavigationEnd, NavigationSkipped, NavigationStart, Router, Event as RouterEvent } from '@angular/router';
import { Subject } from 'rxjs';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { ScanService } from 'src/app/features/bill/scan/scan.service';
import { OverlayBackService } from '../overlay/overlay-back.service';
import { HistoryTrailService } from './history-trail.service';

type State = Record<string, unknown>;

function containsBlob(value: unknown): boolean {
  if (value instanceof Blob) {
    return true;
  }
  return !!value && typeof value === 'object' && Object.values(value).some(containsBlob);
}

/**
 * Session-History wie im Browser: Traversierungen lösen asynchron ein popstate aus. Wie Chromium
 * liest sich der Zustand eines Eintrags, der einen Blob enthält, nach einer Traversierung auf ihn
 * als null (Phase 4 F1/F2); die URL des Eintrags bleibt.
 */
class FakeHistory {
  entries: State[] = [];
  urls: string[] = [];
  index = -1;
  traversals = 0;
  disposed = false;
  private readonly unreadable = new Set<number>();

  get state(): State | null | undefined {
    return this.unreadable.has(this.index) ? null : this.entries[this.index];
  }

  get url(): string {
    return this.urls[this.index];
  }

  replace(state: State): void {
    this.unreadable.delete(this.index);
    this.entries[this.index] = state;
    this.urls[this.index] = (state?.['url'] as string | undefined) ?? this.urls[this.index];
  }

  push(state: State): void {
    const url = (state?.['url'] as string | undefined) ?? this.urls[this.index];
    this.entries.splice(this.index + 1);
    this.urls.splice(this.index + 1);
    this.entries.push(state);
    this.urls.push(url);
    this.index++;
  }

  go(delta: number): void {
    this.traversals++;
    this.index += delta;
    if (containsBlob(this.entries[this.index])) {
      this.unreadable.add(this.index);
    }
    const state = this.state;
    setTimeout(() => {
      if (!this.disposed) {
        window.dispatchEvent(new PopStateEvent('popstate', { state }));
      }
    });
  }
}

/**
 * Router wie HistoryStateManager: imperative Navigation schreibt (push bzw. replace) `{ url, navigationId }`
 * samt `extras.state`; ein popstate wird einen Task später nachgespielt und schreibt den Zustand des
 * erreichten Eintrags in den dann aktuellen (bei gleicher URL: übersprungen).
 */
class FakeRouter {
  readonly events = new Subject<RouterEvent>();
  url = '';
  private navigation: { extras: NavigationBehaviorOptions } | null = null;
  private nextId = 1;

  constructor(private readonly fake: FakeHistory) {}

  readonly currentNavigation = () => this.navigation;

  navigate(commands: unknown[], extras: NavigationBehaviorOptions = {}): Promise<boolean> {
    return this.navigateByUrl(commands.join('/'), extras);
  }

  navigateByUrl(url: string, extras: NavigationBehaviorOptions = {}): Promise<boolean> {
    const id = this.nextId++;
    this.navigation = { extras };
    this.events.next(new NavigationStart(id, url, 'imperative'));
    const state = { ...(extras.state ?? {}), url, navigationId: id };
    if (extras.replaceUrl || url === this.url || this.fake.index < 0) {
      if (this.fake.index < 0) {
        this.fake.push(state);
      } else {
        this.fake.replace(state);
      }
    } else {
      this.fake.push(state);
    }
    this.url = url;
    this.navigation = null;
    this.events.next(new NavigationEnd(id, url, url));
    return Promise.resolve(true);
  }

  readonly onPopState = (event: PopStateEvent) => {
    // wie Location: die URL kommt vom Browser, nicht aus dem (evtl. unlesbaren) Zustand
    const landedUrl = this.fake.url;
    setTimeout(() => {
      if (this.fake.disposed) {
        return;
      }
      const state = event.state as State | null;
      const id = this.nextId++;
      const url = (state?.['url'] as string | undefined) ?? landedUrl;
      if (url === this.url) {
        this.events.next(new NavigationSkipped(id, url, 'same url'));
        return;
      }
      this.navigation = { extras: { replaceUrl: true } };
      this.events.next(new NavigationStart(id, url, 'popstate'));
      this.fake.replace({ ...state, navigationId: id });
      this.url = url;
      this.navigation = null;
      this.events.next(new NavigationEnd(id, url, url));
    });
  };
}

async function png(width: number, height: number): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.fillRect(0, 0, width, height);
  const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png'));
  return new File([blob], 'photo.png', { type: 'image/png' });
}

function tick(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 20));
}

async function settle(): Promise<void> {
  for (let i = 0; i < 6; i++) {
    await tick();
  }
}

/**
 * Seite nach dem Speichern verlassen, mit echtem OverlayBackService und HistoryTrailService
 * (Re-Review N1): auch wenn auf der Seite noch ein Auswahl-Panel offen ist, landet `leaveTo` auf der
 * Liste, mit genau einem History-Schritt, ohne verwaisten Overlay-Eintrag und ohne toten Zurück-Druck.
 */
describe('leaving a page (HistoryTrailService + OverlayBackService)', () => {
  let fake: FakeHistory;
  let router: FakeRouter;
  let overlayBack: OverlayBackService;
  let trail: HistoryTrailService;

  beforeEach(() => {
    fake = new FakeHistory();
    router = new FakeRouter(fake);
    vi.spyOn(history, 'state', 'get').mockImplementation(() => fake.state);
    vi.spyOn(history, 'pushState').mockImplementation(state => fake.push(state as State));
    vi.spyOn(history, 'replaceState').mockImplementation(state => fake.replace(state as State));
    vi.spyOn(history, 'back').mockImplementation(() => fake.go(-1));
    vi.spyOn(history, 'go').mockImplementation(delta => fake.go(delta ?? 0));
    window.addEventListener('popstate', router.onPopState);

    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: router }, { provide: BillApiService, useValue: {} }]
    });
    overlayBack = TestBed.inject(OverlayBackService);
    trail = TestBed.inject(HistoryTrailService);
  });

  afterEach(() => {
    fake.disposed = true;
    window.removeEventListener('popstate', router.onPopState);
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  /** Panel wie PanelBackDirective: schließt es, meldet es sich beim Service ab */
  function openPanel(): { close: ReturnType<typeof vi.fn> } {
    let release: () => void = () => undefined;
    const close = vi.fn(() => release());
    release = overlayBack.register(close);
    return { close };
  }

  async function userBack(): Promise<void> {
    fake.go(-1);
    await settle();
  }

  it('leaves the saved form to the list although the shop autocomplete is still open', async () => {
    await router.navigateByUrl('/expenses');
    await router.navigateByUrl('/bill/list');
    await router.navigateByUrl('/bill/create');
    const panel = openPanel();
    expect(fake.index).toBe(3);

    trail.leaveTo('/bill/list');
    await settle();

    expect(router.url).toBe('/bill/list');
    expect(fake.index).toBe(1);
    expect(fake.traversals).toBe(1);
    expect(panel.close).toHaveBeenCalledTimes(1);
    expect(fake.state).not.toHaveProperty('overlayBack');

    // der nächste Zurück-Druck verlässt die Liste
    await userBack();
    expect(router.url).toBe('/expenses');
    expect(fake.index).toBe(0);
  });

  it('leaves a take-over form two entries back to the analysis list with an open panel', async () => {
    await router.navigateByUrl('/bill/analysis');
    await router.navigateByUrl('/bill/analysis/a1');
    await router.navigateByUrl('/bill/create');
    const panel = openPanel();

    trail.leaveTo('/bill/analysis', 2);
    await settle();

    expect(router.url).toBe('/bill/analysis');
    expect(fake.index).toBe(0);
    expect(fake.traversals).toBe(1);
    expect(panel.close).toHaveBeenCalledTimes(1);
  });

  it('skips the sheet entry left under the form („Alle Felder“) and leaves no dead press', async () => {
    await router.navigateByUrl('/expenses');
    await router.navigateByUrl('/bill/list');
    // Sheet offen, „Alle Felder“: Sheet schließt, Navigation läuft, der Eintrag bleibt liegen
    let releaseSheet: () => void = () => undefined;
    releaseSheet = overlayBack.register(() => releaseSheet());
    releaseSheet();
    await router.navigateByUrl('/bill/create');
    await settle();
    expect(fake.index).toBe(3);

    trail.leaveTo('/bill/list');
    await settle();

    expect(router.url).toBe('/bill/list');
    expect(fake.index).toBe(1);

    await userBack();
    expect(router.url).toBe('/expenses');
  });

  // Phase 4 F1: Formular aus dem Scan (Foto als Vorbelegung), Kategorie per Auswahl, dann Speichern
  // mit offenem Shop-Autocomplete: genau ein Listen-Eintrag, der nächste Zurück-Druck verlässt die Liste
  it('leaves a scanned form with a photo to the list after a select was used', async () => {
    // ohne Netz geht der Scan ohne Overlay gleich ins Formular (Foto + Hinweis)
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    await router.navigateByUrl('/more');
    await router.navigateByUrl('/bill/list');
    await TestBed.inject(ScanService).start(await png(20, 20));
    expect(router.url).toBe('/bill/create');
    expect(fake.index).toBe(2);

    // Kategorie: Auswahl-Panel auf, Wert gewählt, Panel schließt (eigenes history.back)
    let releaseSelect: () => void = () => undefined;
    releaseSelect = overlayBack.register(() => releaseSelect());
    await settle();
    releaseSelect();
    await settle();
    expect(fake.index).toBe(2);
    expect(fake.state).toEqual(expect.objectContaining({ url: '/bill/create', navigationId: expect.any(Number) }));

    // Shop-Autocomplete offen, Enter speichert
    const panel = openPanel();
    trail.leaveTo('/bill/list');
    await settle();

    expect(router.url).toBe('/bill/list');
    expect(fake.index).toBe(1);
    expect(panel.close).toHaveBeenCalledTimes(1);

    await userBack();
    expect(router.url).toBe('/more');
    expect(fake.index).toBe(0);
  });

  it('closes a stacked select over a just released autocomplete with one step', async () => {
    await router.navigateByUrl('/bill/list');
    await router.navigateByUrl('/bill/create');
    let releaseAuto: () => void = () => undefined;
    releaseAuto = overlayBack.register(() => releaseAuto());
    const select = openPanel();
    releaseAuto();

    trail.leaveTo('/bill/list');
    await settle();

    expect(router.url).toBe('/bill/list');
    expect(fake.index).toBe(0);
    expect(select.close).toHaveBeenCalledTimes(1);
  });
});
