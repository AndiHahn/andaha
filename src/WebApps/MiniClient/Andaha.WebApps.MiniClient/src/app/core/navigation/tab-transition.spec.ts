import { TestBed } from '@angular/core/testing';
import { Router, ViewTransitionInfo } from '@angular/router';
import { onTabViewTransition } from './tab-transition';

describe('onTabViewTransition', () => {
  let info: unknown;
  let finish: () => void;
  let transition: { finished: Promise<void> };
  const root = document.documentElement;

  beforeEach(() => {
    info = undefined;
    transition = { finished: new Promise<void>(resolve => finish = resolve) };
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { currentNavigation: () => ({ extras: { info } }) } }]
    });
  });

  afterEach(() => root.classList.remove('tab-next', 'tab-prev'));

  function run(): void {
    TestBed.runInInjectionContext(() => onTabViewTransition({ transition } as unknown as ViewTransitionInfo));
  }

  it('sets the direction class for a tab change and removes it when the transition is finished', async () => {
    info = { tabDirection: 'next' };
    run();
    expect(root.classList).toContain('tab-next');

    finish();
    await transition.finished;
    await Promise.resolve();
    expect(root.classList).not.toContain('tab-next');
  });

  it('slides the other way for the previous tab', () => {
    info = { tabDirection: 'prev' };
    run();
    expect(root.classList).toContain('tab-prev');
    expect(root.classList).not.toContain('tab-next');
  });

  it('sets no class for navigations without a tab direction', () => {
    run();
    expect(root.classList).not.toContain('tab-next');
    expect(root.classList).not.toContain('tab-prev');
  });

  it('sets no class with prefers-reduced-motion', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    info = { tabDirection: 'next' };
    run();
    expect(root.classList).not.toContain('tab-next');
  });
});
