import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OverlayBackService } from './overlay-back.service';

/**
 * Nachgebildete Session-History: pushState/back/go arbeiten auf einer Liste, Traversierungen lösen
 * wie im Browser asynchron ein popstate mit dem Zustand des Zieleintrags aus.
 */
class FakeHistory {
  entries: unknown[] = [{ navigationId: 1 }];
  index = 0;
  /** Dauer einer Traversierung bis zum popstate (ms) */
  popDelay = 0;
  /** nach dem Test: verspätete popstate-Ereignisse nicht mehr in den nächsten Test schicken */
  disposed = false;

  get state(): unknown {
    return this.entries[this.index];
  }

  push(state: unknown): void {
    this.entries.splice(this.index + 1);
    this.entries.push(state);
    this.index++;
  }

  /** Wie history.go: Ziel setzen, popstate im nächsten Task */
  go(delta: number): void {
    this.index += delta;
    const state = this.state;
    setTimeout(() => {
      if (!this.disposed) {
        window.dispatchEvent(new PopStateEvent('popstate', { state }));
      }
    }, this.popDelay);
  }

  /** Zurück-Taste bzw. Zurück-Geste des Geräts */
  userBack(): Promise<void> {
    this.go(-1);
    return tick();
  }
}

function tick(): Promise<void> {
  // verschachtelte Timer drosselt Chrome auf >= 4 ms
  return new Promise(resolve => setTimeout(resolve, 20));
}

describe('OverlayBackService', () => {
  let service: OverlayBackService;
  let fake: FakeHistory;
  let backSpy: ReturnType<typeof vi.spyOn>;
  let goSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fake = new FakeHistory();
    vi.spyOn(history, 'state', 'get').mockImplementation(() => fake.state);
    vi.spyOn(history, 'pushState').mockImplementation(state => fake.push(state));
    backSpy = vi.spyOn(history, 'back').mockImplementation(() => fake.go(-1));
    goSpy = vi.spyOn(history, 'go').mockImplementation(delta => fake.go(delta ?? 0));

    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    service = TestBed.inject(OverlayBackService);
  });

  afterEach(() => {
    fake.disposed = true;
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('pushes a history entry with the same url and a marker when an overlay opens', () => {
    service.register(() => undefined);

    expect(history.pushState).toHaveBeenCalledTimes(1);
    const [state, , url] = vi.mocked(history.pushState).mock.calls[0];
    expect(state).toEqual(expect.objectContaining({ navigationId: 1, overlayBack: expect.any(Number) }));
    expect(url).toBeUndefined();
    expect(fake.index).toBe(1);
  });

  it('closes the overlay once when the back button pops its entry', async () => {
    const close = vi.fn();
    const release = service.register(close);

    await fake.userBack();
    expect(close).toHaveBeenCalledTimes(1);

    // das Overlay meldet sich beim Schließen ab: kein weiteres history.back
    release();
    await tick();
    expect(backSpy).not.toHaveBeenCalled();
    expect(goSpy).not.toHaveBeenCalled();
    expect(fake.index).toBe(0);
  });

  // Review Focus 4: Sheet per Speichern geschlossen, danach Zurück → genau eine Navigation, kein toter Druck
  it('removes the entry with exactly one history.back when the overlay is closed programmatically', async () => {
    const close = vi.fn();
    const release = service.register(close);

    release();
    await tick();

    expect(backSpy).toHaveBeenCalledTimes(1);
    expect(close).not.toHaveBeenCalled();
    expect(fake.index).toBe(0);

    // der nächste Zurück-Druck verlässt die Seite (Eintrag davor), schließt nichts und löst
    // keinen weiteren eigenen Schritt aus
    fake.entries.unshift({ navigationId: 0 });
    fake.index = 1;
    await fake.userBack();
    expect(close).not.toHaveBeenCalled();
    expect(backSpy).toHaveBeenCalledTimes(1);
    expect(goSpy).not.toHaveBeenCalled();
    expect(fake.index).toBe(0);
  });

  it('ignores a second release call', async () => {
    const release = service.register(() => undefined);

    release();
    release();
    await tick();

    expect(backSpy).toHaveBeenCalledTimes(1);
  });

  it('closes stacked overlays one at a time, topmost first', async () => {
    const closeSheet = vi.fn();
    const closeDialog = vi.fn();
    service.register(closeSheet);
    service.register(closeDialog);

    await fake.userBack();
    expect(closeDialog).toHaveBeenCalledTimes(1);
    expect(closeSheet).not.toHaveBeenCalled();

    await fake.userBack();
    expect(closeSheet).toHaveBeenCalledTimes(1);
  });

  it('removes both entries when the lower overlay was closed first', async () => {
    const closeLower = vi.fn();
    const closeUpper = vi.fn();
    const releaseLower = service.register(closeLower);
    const releaseUpper = service.register(closeUpper);

    releaseLower();
    await tick();
    expect(backSpy).not.toHaveBeenCalled();
    expect(fake.index).toBe(2);

    releaseUpper();
    await tick();
    expect(fake.index).toBe(0);
    expect(closeLower).not.toHaveBeenCalled();
    expect(closeUpper).not.toHaveBeenCalled();
  });

  it('waits for its own history.back before pushing the next entry', async () => {
    fake.popDelay = 50;
    const release = service.register(() => undefined);
    release();
    await vi.waitFor(() => expect(backSpy).toHaveBeenCalledTimes(1), { interval: 1 });

    // history.back ist unterwegs, das nächste Overlay öffnet sofort (z. B. Rückfrage nach dem Schließen)
    const closeNext = vi.fn();
    service.register(closeNext);
    expect(fake.entries.length).toBe(2);
    expect(history.pushState).toHaveBeenCalledTimes(1);

    await new Promise(resolve => setTimeout(resolve, 80));
    expect(history.pushState).toHaveBeenCalledTimes(2);
    expect(fake.entries.length).toBe(2);
    expect(fake.index).toBe(1);

    fake.popDelay = 0;

    await fake.userBack();
    expect(closeNext).toHaveBeenCalledTimes(1);
  });

  it('keeps the entry when the router navigated on top of it', async () => {
    const release = service.register(() => undefined);
    fake.push({ navigationId: 2 });

    release();
    await tick();

    expect(backSpy).not.toHaveBeenCalled();
    expect(goSpy).not.toHaveBeenCalled();
    expect(fake.index).toBe(2);
  });

  it('skips a stale overlay entry when the back button returns to it', async () => {
    const release = service.register(() => undefined);
    fake.push({ navigationId: 2 });
    release();
    await tick();

    // Zurück von der neuen Seite landet auf dem verwaisten Overlay-Eintrag und geht gleich weiter
    await fake.userBack();
    await tick();

    expect(fake.index).toBe(0);
    expect(backSpy).toHaveBeenCalledTimes(1);
  });
});
