import { TestBed } from '@angular/core/testing';
import { NavigationBehaviorOptions, NavigationEnd, NavigationStart, Router, Event as RouterEvent } from '@angular/router';
import { Subject } from 'rxjs';
import { OverlayBackService } from '../overlay/overlay-back.service';
import { HistoryTrailService, TRAIL_KEY } from './history-trail.service';

describe('HistoryTrailService', () => {
  let state: Record<string, unknown>;
  let events: Subject<RouterEvent>;
  let extras: NavigationBehaviorOptions;
  let navigateByUrl: ReturnType<typeof vi.fn>;
  let back: ReturnType<typeof vi.fn>;
  let service: HistoryTrailService;
  let nextId: number;

  /** Router-Navigation wie im Browser: der Router schreibt seinen Zustand (ohne die Spur), dann NavigationEnd */
  function navigate(url: string, options: { trigger?: 'imperative' | 'popstate'; replaceUrl?: boolean; restored?: Record<string, unknown> } = {}): void {
    const id = nextId++;
    extras = { replaceUrl: options.replaceUrl };
    events.next(new NavigationStart(id, url, options.trigger ?? 'imperative'));
    state = options.restored ?? { navigationId: id };
    events.next(new NavigationEnd(id, url, url));
  }

  beforeEach(() => {
    nextId = 1;
    state = {};
    events = new Subject<RouterEvent>();
    extras = {};
    navigateByUrl = vi.fn().mockResolvedValue(true);
    back = vi.fn();
    vi.spyOn(history, 'state', 'get').mockImplementation(() => state);
    vi.spyOn(history, 'replaceState').mockImplementation(next => { state = next as Record<string, unknown>; });

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { events, currentNavigation: () => ({ extras }), navigateByUrl } },
        { provide: OverlayBackService, useValue: { back, afterPendingSteps: (step: () => void) => step() } }
      ]
    });
    service = TestBed.inject(HistoryTrailService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('records the urls below each pushed entry, nearest first', () => {
    navigate('/bill/list', { replaceUrl: true });
    expect(service.previousUrls()).toEqual([]);

    navigate('/bill/analysis');
    navigate('/bill/analysis/1');
    expect(service.previousUrls()).toEqual(['/bill/analysis', '/bill/list']);
    expect(state).toEqual(expect.objectContaining({ navigationId: 3 }));
  });

  it('keeps the trail of the replaced entry for replaceUrl and same-url navigations', () => {
    navigate('/bill/list');
    navigate('/bill/create');
    navigate('/bill/list?shared=1', { replaceUrl: true });
    expect(service.previousUrls()).toEqual(['/bill/list']);

    navigate('/bill/list?shared=1');
    expect(service.previousUrls()).toEqual(['/bill/list']);
  });

  it('keeps the trail of a reloaded entry on the first navigation', () => {
    state = { [TRAIL_KEY]: ['/bill/list'] };
    events.next(new NavigationStart(1, '/bill/create', 'imperative'));
    extras = { replaceUrl: true };
    state = { navigationId: 1 };
    events.next(new NavigationEnd(1, '/bill/create', '/bill/create'));

    expect(service.previousUrls()).toEqual(['/bill/list']);
  });

  it('leaves the restored state of back and forward navigations alone', () => {
    navigate('/a');
    navigate('/b');
    const replace = vi.mocked(history.replaceState);
    replace.mockClear();

    navigate('/a', { trigger: 'popstate', restored: { navigationId: 1, [TRAIL_KEY]: [] } });

    expect(replace).not.toHaveBeenCalled();
    expect(service.previousUrls()).toEqual([]);
  });

  it('keeps at most five urls', () => {
    for (const url of ['/1', '/2', '/3', '/4', '/5', '/6', '/7']) {
      navigate(url);
    }
    expect(service.previousUrls()).toEqual(['/6', '/5', '/4', '/3', '/2']);
  });

  describe('leaveTo', () => {
    it('goes back when the list lies directly below', () => {
      navigate('/bill/analysis');
      navigate('/bill/analysis/1');

      service.leaveTo('/bill/analysis');

      expect(back).toHaveBeenCalledWith(1);
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it('ignores query parameters when comparing', () => {
      navigate('/bill/list?shared=1');
      navigate('/bill/create');

      service.leaveTo('/bill/list');

      expect(back).toHaveBeenCalledWith(1);
    });

    it('replaces the current entry when the list is not below (deep link, other origin)', () => {
      navigate('/bill/analysis/1', { replaceUrl: true });

      service.leaveTo('/bill/analysis');

      expect(back).not.toHaveBeenCalled();
      expect(navigateByUrl).toHaveBeenCalledWith('/bill/analysis', { replaceUrl: true });
    });

    it('only looks as deep as allowed', () => {
      navigate('/bill/analysis');
      navigate('/bill/analysis/1');
      navigate('/bill/create');

      service.leaveTo('/bill/analysis');
      expect(back).not.toHaveBeenCalled();
      expect(navigateByUrl).toHaveBeenCalledWith('/bill/analysis', { replaceUrl: true });

      service.leaveTo('/bill/analysis', 2);
      expect(back).toHaveBeenCalledWith(2);
    });
  });
});
