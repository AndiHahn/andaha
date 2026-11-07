import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AppComponent } from './app.component';
import { AppUpdateService } from './core/app-update.service';
import { AuthService } from './core/auth.service';
import { PageTitleService } from './core/page-title/page-title.service';
import { TourService } from './core/tour/tour.service';
import { BillContextService } from './features/bill/services/bill-context.service';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let request: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    request = vi.fn();
    await TestBed.configureTestingModule({
      imports: [AppComponent, NoopAnimationsModule],
      providers: [
        provideRouter([{ path: 'bill/list', children: [] }, { path: 'export', children: [] }]),
        { provide: TourService, useValue: { request } },
        { provide: AppUpdateService, useValue: { init: vi.fn() } },
        { provide: AuthService, useValue: { loggedIn: () => of(true), userInfo: () => of({ userName: 'Test' }), logout: vi.fn() } },
        { provide: BillContextService, useValue: { syncing: () => of(false) } },
        { provide: PageTitleService, useValue: { title$: of(''), back$: of(null), desktopBack$: of(null), action$: of(null) } },
        { provide: BreakpointObserver, useValue: { observe: () => new BehaviorSubject({ matches: true, breakpoints: {} }), isMatched: () => true } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  const sideLink = (label: string) =>
    Array.from<HTMLAnchorElement>(fixture.nativeElement.querySelectorAll('.side a.dl')).find(a => a.textContent!.includes(label))!;

  it('sidebar Mehr group shows Schnell-Hilfe and clicking it requests the tour', async () => {
    const link = sideLink('Schnell-Hilfe');
    expect(link).toBeDefined();
    expect(link.getAttribute('href')).toBe('/bill/list');

    link.click();
    await fixture.whenStable();

    expect(request).toHaveBeenCalledTimes(1);
    expect(TestBed.inject(Router).url).toBe('/bill/list');
  });

  it('other sidebar links do not request the tour', () => {
    sideLink('Export').click();

    expect(request).not.toHaveBeenCalled();
  });
});
