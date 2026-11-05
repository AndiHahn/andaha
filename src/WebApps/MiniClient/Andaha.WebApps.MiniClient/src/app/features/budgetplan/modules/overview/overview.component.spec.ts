import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { BudgetPlanApiService } from 'src/app/api/budgetplan/budgetplan-api.service';
import { BudgetPlanDto } from 'src/app/api/budgetplan/dtos/BudgetPlanDto';
import { CostCategory } from 'src/app/api/budgetplan/dtos/CostCategory';
import { SheetService } from 'src/app/core/overlay/sheet.service';
import { BudgetplanContextService } from '../../services/budgetplan-context.service';
import { OverviewComponent } from './overview.component';

registerLocaleData(localeDe, 'de');

describe('OverviewComponent', () => {
  let fixture: ComponentFixture<OverviewComponent>;
  let settings: { getBudgetPlanSettings: ReturnType<typeof vi.fn> };
  let dismissed$: Subject<number | undefined>;
  let sheet: { open: ReturnType<typeof vi.fn> };
  let desktop: boolean;

  const plan: BudgetPlanDto = {
    income: 4200,
    expenses: [
      { category: CostCategory.FlatAndOperating, value: 1240 },
      { category: CostCategory.MotorVehicle, value: 410 }
    ]
  };

  const text = () => (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ');

  function create(share = 35): void {
    settings.getBudgetPlanSettings.mockReturnValue(of({ livingCostShare: share }));
    fixture = TestBed.createComponent(OverviewComponent);
    fixture.detectChanges();
  }

  beforeEach(() => {
    desktop = false;
    dismissed$ = new Subject<number | undefined>();
    settings = { getBudgetPlanSettings: vi.fn() };
    sheet = { open: vi.fn().mockReturnValue({ afterDismissed: () => dismissed$.asObservable() }) };

    TestBed.configureTestingModule({
      imports: [OverviewComponent],
      providers: [
        provideRouter([]),
        { provide: BudgetplanContextService, useValue: { budgetPlan: () => of(plan), error: signal(false), retry: vi.fn() } },
        { provide: BudgetPlanApiService, useValue: settings },
        { provide: SheetService, useValue: sheet },
        { provide: MatDialog, useValue: { open: vi.fn() } },
        { provide: BreakpointObserver, useValue: { isMatched: () => desktop } }
      ]
    });
  });

  it('living costs use saved share and show "35 % vom Einkommen"', () => {
    create(35);

    expect(text()).toContain('35 % vom Einkommen');
    expect(text()).toContain('1.470,00 €');

    fixture.destroy();
    create(20);

    expect(text()).toContain('20 % vom Einkommen');
    expect(text()).toContain('840,00 €');
  });

  it('sheet saves share and recalculates', () => {
    create(35);
    const row = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.living-costs')!;

    row.click();

    expect(sheet.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ data: { income: 4200, share: 35 } }));

    dismissed$.next(50);
    fixture.detectChanges();

    expect(text()).toContain('50 % vom Einkommen');
    expect(text()).toContain('2.100,00 €');
    // Überschuss: 4200 - 2100 - 1650 = 450
    expect(text()).toContain('+450,00');
  });

  it('keeps the share when the sheet is dismissed without saving', () => {
    create(35);
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.living-costs')!.click();

    dismissed$.next(undefined);
    fixture.detectChanges();

    expect(text()).toContain('35 % vom Einkommen');
  });

  it('category row navigates with category query', () => {
    create();
    const links = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('a.kv'));

    const hrefs = links.map(link => link.getAttribute('href'));

    expect(hrefs).toContain('/budgetplan/fixedcost?category=FlatAndOperating');
    expect(hrefs).toContain('/budgetplan/fixedcost?category=MotorVehicle');
    expect(hrefs).toContain('/budgetplan/income');
  });

  it('shows the error state when the settings fail to load', () => {
    settings.getBudgetPlanSettings.mockReturnValue(throwError(() => new Error('fail')));
    fixture = TestBed.createComponent(OverviewComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.loadState).toBe('error');
    expect(text()).toContain('Erneut versuchen');
  });
});
