import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { BillAnalyzedDto } from 'src/app/api/shopping/dtos/BillAnalyzedDto';
import { AnalyzedBillContextService } from 'src/app/features/bill-analysis/services/analyzed-bill-context.service';
import { NAV_AREAS, NavArea } from '../nav-areas';
import { AreaTabsComponent } from './area-tabs.component';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.Eager })
class DummyComponent {
}

describe('AreaTabsComponent', () => {
  const billArea: NavArea = NAV_AREAS.find(a => a.id === 'bill')!;

  let fixture: ComponentFixture<AreaTabsComponent>;
  let router: Router;
  let bills$: BehaviorSubject<BillAnalyzedDto[]>;

  beforeEach(async () => {
    bills$ = new BehaviorSubject<BillAnalyzedDto[]>([]);

    await TestBed.configureTestingModule({
      imports: [AreaTabsComponent],
      providers: [
        provideRouter([{ path: '**', component: DummyComponent }]),
        { provide: AnalyzedBillContextService, useValue: { bills: () => bills$.asObservable() } }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(AreaTabsComponent);
    fixture.componentRef.setInput('area', billArea);
  });

  async function navigate(url: string): Promise<void> {
    await router.navigateByUrl(url);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function tabs(): HTMLAnchorElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('[role="tab"]'));
  }

  it('renders the tabs of the area in a tablist', async () => {
    await navigate('/bill/list');

    const list: HTMLElement = fixture.nativeElement.querySelector('[role="tablist"]');
    expect(list.getAttribute('aria-label')).toBe('Rechnungen');
    expect(tabs().map(t => t.textContent?.trim())).toEqual(['Liste', 'Analyse', 'Statistik']);
    expect(tabs().map(t => t.getAttribute('href'))).toEqual(['/bill/list', '/bill/analysis', '/bill/expenses']);
  });

  it('marks the active tab with aria-selected', async () => {
    await navigate('/bill/expenses');

    expect(tabs().map(t => t.getAttribute('aria-selected'))).toEqual(['false', 'false', 'true']);
    expect(tabs()[2].classList).toContain('on');
  });

  it('hides the analysis badge while there are no open analyses', async () => {
    await navigate('/bill/list');

    expect(fixture.nativeElement.querySelector('.cnt')).toBeNull();
  });

  it('shows the number of open analyses on the analysis tab', async () => {
    bills$.next([{ id: 'a' } as BillAnalyzedDto, { id: 'b' } as BillAnalyzedDto]);
    await navigate('/bill/list');

    const badge: HTMLElement = tabs()[1].querySelector('.cnt')!;
    expect(badge.textContent?.trim()).toBe('2');
  });

  it('passes the slide direction from the tab order when a tab is tapped', async () => {
    await navigate('/bill/analysis');
    const spy = vi.spyOn(router, 'navigateByUrl');

    tabs()[2].click();
    expect(spy.mock.calls[0][1]).toEqual(expect.objectContaining({ info: { tabDirection: 'next' } }));

    tabs()[0].click();
    expect(spy.mock.calls[1][1]).toEqual(expect.objectContaining({ info: { tabDirection: 'prev' } }));
  });

  it('shows no tabs on detail pages', async () => {
    await navigate('/bill/analysis/5');

    expect(fixture.nativeElement.querySelector('[role="tablist"]')).toBeNull();
  });
});
