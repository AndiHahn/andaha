import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { page } from 'vitest/browser';
import { TourService } from '../tour.service';
import { TourOverlayComponent } from './tour-overlay.component';

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

describe('TourOverlayComponent', () => {
  let stepIndex: ReturnType<typeof signal<number>>;
  let desktop: ReturnType<typeof signal<boolean>>;
  let tour: { stepIndex: typeof stepIndex; desktop: typeof desktop; next: ReturnType<typeof vi.fn>; back: ReturnType<typeof vi.fn>; end: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<TourOverlayComponent> | null;
  let fixtures: HTMLElement[];

  /** Fixed-position element with a data-tour id at a known place */
  function target(id: string, box: Box, inner = ''): HTMLElement {
    const el = document.createElement('div');
    el.setAttribute('data-tour', id);
    el.innerHTML = inner;
    place(el, box);
    document.body.appendChild(el);
    fixtures.push(el);
    return el;
  }

  function place(el: HTMLElement, box: Box): void {
    el.style.cssText = `position:fixed;left:${box.x}px;top:${box.y}px;width:${box.width}px;height:${box.height}px`;
  }

  function mobileShell(): void {
    target('tabs', { x: 0, y: 56, width: 390, height: 48 });
    target('main-nav', { x: 0, y: 780, width: 390, height: 64 });
  }

  /** Renders, then runs the first animation frame (measure, place, focus) */
  function render(): ComponentFixture<TourOverlayComponent> {
    fixture = TestBed.createComponent(TourOverlayComponent);
    fixture.detectChanges();
    frame();
    return fixture;
  }

  function frame(): void {
    vi.advanceTimersToNextFrame();
    fixture!.detectChanges();
  }

  function host(): HTMLElement {
    return fixture!.nativeElement as HTMLElement;
  }

  function notes(): HTMLElement[] {
    return Array.from(host().querySelectorAll<HTMLElement>('.note'));
  }

  function noteText(): string[] {
    return notes().map(n =>
      Array.from(n.querySelectorAll('.label, .text'))
        .map(part => part.textContent!.trim())
        .join(' ')
    );
  }

  function primary(): HTMLButtonElement {
    return host().querySelector<HTMLButtonElement>('button.primary')!;
  }

  function button(text: string): HTMLButtonElement | undefined {
    return Array.from(host().querySelectorAll<HTMLButtonElement>('button')).find(b => b.textContent!.trim() === text);
  }

  async function goToStep(index: number): Promise<void> {
    stepIndex.set(index);
    fixture!.detectChanges();
    frame();
  }

  beforeEach(async () => {
    await page.viewport(390, 844);
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    fixture = null;
    fixtures = [];
    stepIndex = signal(0);
    desktop = signal(false);
    tour = { stepIndex, desktop, next: vi.fn(), back: vi.fn(), end: vi.fn() };
    TestBed.configureTestingModule({
      imports: [TourOverlayComponent],
      providers: [{ provide: TourService, useValue: tour }],
    });
  });

  afterEach(() => {
    fixture?.destroy();
    fixtures.forEach(el => el.remove());
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('renders the step title for screen readers and n / 3', () => {
    mobileShell();
    render();
    const dialog = host();
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const title = document.getElementById(dialog.getAttribute('aria-labelledby')!)!;
    expect(title.tagName).toBe('H2');
    expect(title.textContent!.trim()).toBe('Menüs');
    expect(dialog.querySelector('.count')!.textContent).toContain('1 / 3');
  });

  it('renders one note per resolvable target and drops notes whose target is missing', async () => {
    target('entry', { x: 16, y: 700, width: 300, height: 48 });
    target('camera', { x: 326, y: 700, width: 48, height: 48 });
    render();
    await goToStep(1);
    expect(noteText()).toEqual([
      'Rechnung eintragen Betrag tippen, Vorlage wählen, fertig.',
      'Foto Wird automatisch angelegt. Unklares landet unter Scans.',
    ]);
    expect(host().querySelectorAll('.outline').length).toBe(2);
    expect(host().querySelectorAll('.arrow').length).toBe(2);
  });

  it('mobile menus step shows the swipe hint, desktop does not', async () => {
    mobileShell();
    render();
    expect(notes().length).toBe(3);
    expect(host().querySelector('.note .swipe')).not.toBeNull();
    fixture!.destroy();

    await page.viewport(1440, 900);
    desktop.set(true);
    render();
    expect(notes().length).toBe(2);
    expect(host().querySelector('.note .swipe')).toBeNull();
    expect(noteText()[0]).toContain('zum Wechseln klicken');
  });

  it('Hauptmenü note uses the main tone class, Untermenü the sub tone class', () => {
    mobileShell();
    render();
    expect(host().querySelector('.note.tone-main')!.textContent).toContain('Hauptmenü');
    expect(host().querySelector('.note.tone-sub')!.textContent).toContain('Untermenü');
    expect(host().querySelector('.outline.tone-main')).not.toBeNull();
    expect(host().querySelector('.outline.tone-sub')).not.toBeNull();
  });

  it('primary button says Weiter, on the last step Los geht’s and calls end()', async () => {
    mobileShell();
    render();
    expect(primary().textContent!.trim()).toBe('Weiter');
    primary().click();
    expect(tour.next).toHaveBeenCalledTimes(1);
    expect(tour.end).not.toHaveBeenCalled();

    await goToStep(2);
    expect(primary().textContent!.trim()).toBe('Los geht’s');
    primary().click();
    expect(tour.end).toHaveBeenCalledTimes(1);
  });

  it('Zurück is hidden on step 1 and calls back() on step 2', async () => {
    mobileShell();
    render();
    expect(button('Zurück')).toBeUndefined();
    await goToStep(1);
    button('Zurück')!.click();
    expect(tour.back).toHaveBeenCalledTimes(1);
  });

  it('Überspringen and Escape call end()', () => {
    mobileShell();
    render();
    button('Überspringen')!.click();
    expect(tour.end).toHaveBeenCalledTimes(1);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(tour.end).toHaveBeenCalledTimes(2);
  });

  it('a click on the veil does nothing', () => {
    mobileShell();
    const appButton = document.createElement('button');
    const appClick = vi.fn();
    appButton.addEventListener('click', appClick);
    target('bill-row', { x: 16, y: 300, width: 300, height: 56 }).appendChild(appButton);
    render();

    host().querySelector<SVGElement>('svg.veil')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(tour.end).not.toHaveBeenCalled();
    expect(tour.next).not.toHaveBeenCalled();
    expect(tour.back).not.toHaveBeenCalled();
    // the overlay lies over the whole app, also over the lit targets
    expect(host().contains(document.elementFromPoint(20, 400))).toBe(true);
    expect(host().contains(document.elementFromPoint(30, 310))).toBe(true);
  });

  it('focuses the primary button on step change', async () => {
    mobileShell();
    render();
    expect(document.activeElement).toBe(primary());
    button('Überspringen')!.focus();
    await goToStep(1);
    expect(document.activeElement).toBe(primary());
  });

  it('pulls focus back from the quick-entry preview into the tour', () => {
    mobileShell();
    render();
    // like the CDK overlay container: the preview dialog and the tour are siblings in it
    const container = document.createElement('div');
    container.className = 'cdk-overlay-container';
    const preview = document.createElement('button');
    container.append(preview, host());
    document.body.appendChild(container);
    fixtures.push(container);

    preview.focus();
    expect(document.activeElement).toBe(primary());
  });

  it('re-places notes on window resize', () => {
    const tabs = target('tabs', { x: 0, y: 56, width: 390, height: 48 });
    render();
    // past the settle window after the step change: only resize re-measures now
    vi.advanceTimersByTime(1000);
    fixture!.detectChanges();
    const before = notes()[0].getBoundingClientRect();
    expect(before.top).toBeGreaterThan(56 + 48);

    place(tabs, { x: 0, y: 400, width: 390, height: 48 });
    window.dispatchEvent(new Event('resize'));
    frame();
    expect(notes()[0].getBoundingClientRect().top).not.toBe(before.top);
  });

  it('templates without tiles shows the no-tiles copy', async () => {
    target('tiles', { x: 16, y: 400, width: 358, height: 200 });
    target('tiles-other', { x: 16, y: 610, width: 358, height: 48 });
    render();
    await goToStep(2);
    expect(noteText()).toContain('Vorlagen Hier erscheinen deine häufigen Einkäufe als Kachel.');

    fixtures[0].innerHTML = '<button role="radio">Billa</button>';
    frame();
    expect(noteText()[0]).toContain('Lang drücken auf einen Vorschlag heftet ihn an.');
  });
});
