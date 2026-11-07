import { Overlay } from '@angular/cdk/overlay';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { OverlayBackService } from 'src/app/core/overlay/overlay-back.service';
import { QuickEntryHandle, QuickEntryService } from 'src/app/features/bill/quick-entry/quick-entry.service';
import { TOUR_SEEN_KEY } from './tour-seen-store';
import { TOUR_OVERLAY_COMPONENT, TourService } from './tour.service';

@Component({ selector: 'app-dummy-tour-overlay', template: '<p class="dummy-tour">tour</p>' })
class DummyTourOverlayComponent {}

class FakeHandle implements QuickEntryHandle {
  readonly closed = new Subject<void>();
  readonly closed$ = this.closed.asObservable();
  close = vi.fn(() => {
    this.closed.next();
    this.closed.complete();
  });
}

describe('TourService', () => {
  let openCount: ReturnType<typeof signal<number>>;
  let release: ReturnType<typeof vi.fn>;
  let registered: (() => void) | null;
  let handle: FakeHandle;
  let quickEntryOpen: ReturnType<typeof vi.fn>;
  let service: TourService;

  function settle(ms = 0): void {
    TestBed.tick();
    vi.advanceTimersByTime(ms);
    TestBed.tick();
  }

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.removeItem(TOUR_SEEN_KEY);
    openCount = signal(0);
    release = vi.fn();
    registered = null;
    handle = new FakeHandle();
    quickEntryOpen = vi.fn(() => handle);
    TestBed.configureTestingModule({
      providers: [
        { provide: TOUR_OVERLAY_COMPONENT, useValue: DummyTourOverlayComponent },
        { provide: QuickEntryService, useValue: { open: quickEntryOpen } },
        {
          provide: OverlayBackService,
          useValue: {
            openCount,
            register: (close: () => void) => {
              registered = close;
              return release;
            },
          },
        },
      ],
    });
    service = TestBed.inject(TourService);
  });

  afterEach(() => {
    service.end();
    TestBed.resetTestingModule();
    localStorage.removeItem(TOUR_SEEN_KEY);
    vi.useRealTimers();
  });

  function startManually(): void {
    service.setListReady(true);
    service.request();
    settle(400);
  }

  it('does not start before the list is ready', () => {
    settle(1000);
    expect(service.active()).toBe(false);
  });

  it('starts 400 ms after the list is ready and no overlay is open', () => {
    service.setListReady(true);
    settle(399);
    expect(service.active()).toBe(false);
    settle(1);
    expect(service.active()).toBe(true);
    expect(service.stepIndex()).toBe(0);
    expect(document.querySelector('.dummy-tour')).not.toBeNull();
  });

  it('does not start while an overlay is open, starts 400 ms after it closes', () => {
    openCount.set(1);
    service.setListReady(true);
    settle(1000);
    expect(service.active()).toBe(false);
    openCount.set(0);
    settle(399);
    expect(service.active()).toBe(false);
    settle(1);
    expect(service.active()).toBe(true);
  });

  it('aborts the pending start if an overlay opens during the delay', () => {
    service.setListReady(true);
    settle(200);
    openCount.set(1);
    settle(1000);
    expect(service.active()).toBe(false);
  });

  it('marks seen when shown, before it ends', () => {
    service.setListReady(true);
    settle(400);
    expect(service.active()).toBe(true);
    expect(localStorage.getItem(TOUR_SEEN_KEY)).toBe('1');
  });

  it('does not auto-start when already seen', () => {
    localStorage.setItem(TOUR_SEEN_KEY, '1');
    service.setListReady(true);
    settle(1000);
    expect(service.active()).toBe(false);
  });

  it('does not auto-start twice in one session', () => {
    service.setListReady(true);
    settle(400);
    service.end();
    settle(1000);
    expect(service.active()).toBe(false);
    service.setListReady(false);
    service.setListReady(true);
    settle(1000);
    expect(service.active()).toBe(false);
  });

  it('request() starts even when seen', () => {
    localStorage.setItem(TOUR_SEEN_KEY, '1');
    startManually();
    expect(service.active()).toBe(true);
  });

  it('request() waits for the list to be ready', () => {
    localStorage.setItem(TOUR_SEEN_KEY, '1');
    service.request();
    settle(1000);
    expect(service.active()).toBe(false);
    service.setListReady(true);
    settle(400);
    expect(service.active()).toBe(true);
  });

  it('next/back move the step and back is a no-op on step 1', () => {
    startManually();
    service.back();
    expect(service.stepIndex()).toBe(0);
    service.next();
    expect(service.stepIndex()).toBe(1);
    service.back();
    expect(service.stepIndex()).toBe(0);
    service.next();
    service.next();
    expect(service.stepIndex()).toBe(2);
  });

  it('entering templates opens the quick entry preview, leaving it closes the preview', () => {
    startManually();
    service.next();
    expect(quickEntryOpen).not.toHaveBeenCalled();
    service.next();
    expect(quickEntryOpen).toHaveBeenCalledWith({ preview: true });
    service.back();
    expect(handle.close).toHaveBeenCalledTimes(1);
    expect(service.active()).toBe(true);
    expect(service.stepIndex()).toBe(1);
  });

  it('external close of the preview ends the tour', () => {
    startManually();
    service.next();
    service.next();
    handle.closed.next();
    expect(service.active()).toBe(false);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('keeps the tour host z-index above the CDK overlay layer', () => {
    startManually();
    const host = document.querySelector('.dummy-tour')!.closest('.cdk-global-overlay-wrapper') as HTMLElement;
    expect(host.style.zIndex).toBe('1001');
  });

  it('end() closes the preview, releases the back registration and is idempotent', () => {
    startManually();
    service.next();
    service.next();
    service.end();
    service.end();
    expect(handle.close).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
    expect(service.active()).toBe(false);
    expect(document.querySelector('.dummy-tour')).toBeNull();
  });

  it('Back (registered close) ends the tour', () => {
    startManually();
    registered!();
    expect(service.active()).toBe(false);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('continues on templates when open() returns null', () => {
    quickEntryOpen.mockReturnValue(null);
    startManually();
    service.next();
    service.next();
    expect(service.active()).toBe(true);
    expect(service.stepIndex()).toBe(2);
    service.end();
    expect(service.active()).toBe(false);
  });

  it('does not restart after end() when saving the seen flag fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    service.setListReady(true);
    settle(400);
    expect(service.active()).toBe(true);
    service.end();
    settle(5000);
    expect(service.active()).toBe(false);
    vi.restoreAllMocks();
  });

  it('ignores request() while the tour is active', () => {
    startManually();
    service.request();
    service.end();
    settle(5000);
    expect(service.active()).toBe(false);
  });

  it('cleans up when creating the overlay fails', () => {
    const overlay = TestBed.inject(Overlay);
    vi.spyOn(overlay, 'create').mockImplementation(() => {
      throw new Error('boom');
    });
    service.setListReady(true);
    expect(() => settle(400)).toThrow();
    expect(service.active()).toBe(false);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('Back (registered close) on templates closes the preview and ends the tour', () => {
    startManually();
    service.next();
    service.next();
    registered!();
    expect(handle.close).toHaveBeenCalledTimes(1);
    expect(service.active()).toBe(false);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('aborts the pending start if the list is no longer ready during the delay', () => {
    service.setListReady(true);
    settle(200);
    service.setListReady(false);
    settle(1000);
    expect(service.active()).toBe(false);
  });
});
