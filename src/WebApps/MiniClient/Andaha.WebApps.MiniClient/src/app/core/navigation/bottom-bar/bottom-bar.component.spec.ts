import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BottomBarComponent } from './bottom-bar.component';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.Eager })
class DummyComponent {
}

describe('BottomBarComponent', () => {
  let fixture: ComponentFixture<BottomBarComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomBarComponent],
      providers: [provideRouter([{ path: '**', component: DummyComponent }])]
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(BottomBarComponent);
  });

  async function navigate(url: string): Promise<void> {
    await router.navigateByUrl(url);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function links(): HTMLAnchorElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('nav a'));
  }

  it('shows the four areas', async () => {
    await navigate('/bill/list');

    const nav: HTMLElement = fixture.nativeElement.querySelector('nav');
    expect(nav.getAttribute('aria-label')).toBe('Hauptbereiche');
    expect(links().map(a => a.textContent?.replace(/\s+/g, ' ').trim()))
      .toEqual(['receipt_long Rechnungen', 'account_balance_wallet Haushalt', 'group Stunden', 'more_horiz Mehr']);
    expect(links().map(a => a.getAttribute('href'))).toEqual(['/bill/list', '/budgetplan/overview', '/work/person', '/more']);
  });

  it('marks the area of the current url as active', async () => {
    await navigate('/budgetplan/fixedcost/create');

    expect(links().map(a => a.getAttribute('aria-current'))).toEqual([null, 'page', null, null]);
    expect(links()[1].classList).toContain('on');
  });

  it('marks Mehr active on settings pages', async () => {
    await navigate('/settings/categories');

    expect(links()[3].getAttribute('aria-current')).toBe('page');
  });
});
