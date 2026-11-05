import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { TimeRangeDto } from 'src/app/api/common-dtos/TimeRangeDto';
import { PersonApiService } from 'src/app/api/work/person-api.service';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { ExpenseContextService } from '../bill/services/expense-context.service';
import { ExportComponent } from './export.component';

describe('ExportComponent', () => {
  let fixture: ComponentFixture<ExportComponent>;
  let component: ExportComponent;
  let host: HTMLElement;
  let downloadExpenses: ReturnType<typeof vi.fn>;
  let personExport: ReturnType<typeof vi.fn>;
  let openFromComponent: ReturnType<typeof vi.fn>;
  let categoryRetry: ReturnType<typeof vi.fn>;
  let categoryError: ReturnType<typeof signal<boolean>>;

  function setShareSupport(supported: boolean): void {
    Object.defineProperty(navigator, 'canShare', { value: supported ? () => true : undefined, configurable: true });
    Object.defineProperty(navigator, 'share', { value: supported ? () => Promise.resolve() : undefined, configurable: true });
  }

  async function create(
    shareSupported = false,
    availableRange: TimeRangeDto | null = { startTimeUtc: new Date(2023, 0, 5), endTimeUtc: new Date(2026, 10, 5) }
  ): Promise<void> {
    setShareSupport(shareSupported);
    downloadExpenses = vi.fn(() => of('downloaded'));
    personExport = vi.fn(() => of(new HttpResponse<Blob>({ body: null, headers: new HttpHeaders() })));
    openFromComponent = vi.fn();
    categoryRetry = vi.fn();
    categoryError = signal(false);

    await TestBed.configureTestingModule({
      imports: [ExportComponent],
      providers: [
        {
          provide: ExpenseContextService,
          useValue: {
            availableTimeRange: () => new BehaviorSubject(availableRange).asObservable(),
            downloadExpenses
          }
        },
        { provide: PersonApiService, useValue: { export: personExport } },
        {
          provide: BillCategoryContextService,
          useValue: {
            categories: () => of([{ id: '1', name: 'Lebensmittel' }, { id: '2', name: 'Auto' }]),
            loading: signal(false),
            error: categoryError,
            retry: categoryRetry
          }
        },
        { provide: MatSnackBar, useValue: { openFromComponent } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExportComponent);
    component = fixture.componentInstance;
    host = fixture.nativeElement;
    fixture.detectChanges();
  }

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'canShare');
    Reflect.deleteProperty(navigator, 'share');
  });

  function expensesButton(): HTMLButtonElement {
    return host.querySelector('button.btn.pri') as HTMLButtonElement;
  }

  function workButton(): HTMLButtonElement {
    return host.querySelector('button.btn.sec2') as HTMLButtonElement;
  }

  it('defaults to "Dieses Jahr" and exports the whole current year', async () => {
    await create();
    const year = new Date().getFullYear();

    expect(host.querySelector('.chip.on')?.textContent?.trim()).toBe('Dieses Jahr');

    expensesButton().click();

    expect(downloadExpenses).toHaveBeenCalledWith(new Date(year, 0, 1), new Date(year, 11, 31), []);
  });

  it('sends selected category names', async () => {
    await create();
    component.categoryControl.setValue(['Auto']);

    expensesButton().click();

    expect(downloadExpenses.mock.calls[0][2]).toEqual(['Auto']);
  });

  it('picking a preset updates the range and manual dates clear the preset', async () => {
    await create();

    (host.querySelectorAll('.chip')[2] as HTMLButtonElement).click();
    fixture.detectChanges();
    const year = new Date().getFullYear() - 1;
    expensesButton().click();
    expect(downloadExpenses).toHaveBeenCalledWith(new Date(year, 0, 1), new Date(year, 11, 31), []);
    expect(host.querySelector('.chip.on')?.textContent?.trim()).toBe('Letztes Jahr');

    component.fromControl.setValue(new Date(year, 2, 1));
    fixture.detectChanges();
    expect(host.querySelector('.chip.on')).toBeNull();
  });

  it('"Alles" uses the available time range', async () => {
    await create();

    (host.querySelectorAll('.chip')[3] as HTMLButtonElement).click();
    expensesButton().click();

    expect(downloadExpenses).toHaveBeenCalledWith(new Date(2023, 0, 5), new Date(2026, 10, 5), []);
  });

  it('"Alles" is disabled for an account without bills, the other presets stay usable', async () => {
    await create(false, null);
    const alles = Array.from(host.querySelectorAll<HTMLButtonElement>('.chip')).find(c => c.textContent?.trim() === 'Alles')!;

    expect(alles.disabled).toBe(true);
    expect(expensesButton().disabled).toBe(false);
  });

  it('disables the export when "Von" lies after "Bis"', async () => {
    await create();
    component.fromControl.setValue(new Date(2026, 5, 1));
    component.toControl.setValue(new Date(2026, 4, 1));
    fixture.detectChanges();

    expect(expensesButton().disabled).toBe(true);
    expect(host.querySelector('.field-error')).not.toBeNull();
  });

  it('button label is "teilen" when files can be shared', async () => {
    await create(true);

    expect(expensesButton().textContent).toContain('Ausgaben teilen');
    expect(workButton().textContent).toContain('Stunden teilen');
  });

  it('button label is "herunterladen" otherwise', async () => {
    await create(false);

    expect(expensesButton().textContent).toContain('Ausgaben herunterladen');
  });

  it('cancelled share is no error', async () => {
    await create(true);
    downloadExpenses.mockReturnValue(of('cancelled'));

    expensesButton().click();
    fixture.detectChanges();

    expect(openFromComponent).not.toHaveBeenCalled();
    expect(expensesButton().disabled).toBe(false);
  });

  it('error shows snackbar and re-enables the buttons', async () => {
    await create();
    downloadExpenses.mockReturnValue(throwError(() => new Error('boom')));

    expensesButton().click();
    fixture.detectChanges();

    expect(openFromComponent).toHaveBeenCalledTimes(1);
    expect(expensesButton().disabled).toBe(false);
    expect(workButton().disabled).toBe(false);
  });

  it('work export error shows snackbar', async () => {
    await create();
    personExport.mockReturnValue(throwError(() => new Error('boom')));

    workButton().click();

    expect(openFromComponent).toHaveBeenCalledTimes(1);
  });

  it('shows a spinner and disables both buttons while an export runs', async () => {
    await create();
    const pending = new Subject<string>();
    downloadExpenses.mockReturnValue(pending.asObservable());

    expensesButton().click();
    fixture.detectChanges();

    expect(expensesButton().querySelectorAll('mat-spinner').length).toBe(1);
    expect(workButton().querySelectorAll('mat-spinner').length).toBe(0);
    expect(expensesButton().disabled).toBe(true);
    expect(workButton().disabled).toBe(true);

    pending.next('downloaded');
    fixture.detectChanges();

    expect(host.querySelectorAll('mat-spinner').length).toBe(0);
    expect(expensesButton().disabled).toBe(false);
  });

  it('shows the load error with retry when the categories failed', async () => {
    await create();
    categoryError.set(true);
    fixture.detectChanges();

    (host.querySelector('.state-retry') as HTMLButtonElement).click();

    expect(categoryRetry).toHaveBeenCalled();
    expect(host.querySelector('button.btn.pri')).toBeNull();
  });
});
