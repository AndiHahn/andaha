import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { DecimalPipe, formatDate } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { EMPTY, Observable, Subject, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { TimeRangeDtoRaw } from 'src/app/api/common-dtos/TimeRangeDto';
import { ExpenseApiService } from 'src/app/api/shopping/expense-api.service';
import { ExpenseDto } from 'src/app/api/shopping/dtos/ExpenseDto';
import { MonthlyCostsDto } from 'src/app/api/shopping/dtos/MonthlyCostsDto';
import { BillContextService } from 'src/app/features/bill/services/bill-context.service';
import { ExpenseContextService } from 'src/app/features/bill/services/expense-context.service';
import { LoadState, LoadStateComponent } from 'src/app/shared/load-state/load-state.component';
import { mapTimeRangeDto, TimeRange } from '../../../../shared/models/TimeRange';
import { CategoryRowsComponent } from './category-rows/category-rows.component';
import { formatPercentChange, percentChange, previousRange } from './functions/compare';
import { MonthlyBarsComponent } from './monthly-bars/monthly-bars.component';
import { DateType } from './timerange-selection/DateType';
import { TimerangeSelectionComponent } from './timerange-selection/timerange-selection.component';

/** Vorzeitraum und Monatsbalken; nur bei Monat und Jahr */
interface Comparison {
  previous: ExpenseDto[];
  months: MonthlyCostsDto[];
}

const BAR_MONTHS = 12;

/**
 * Rechnungen → Statistik (design.md 3.2, Mockup 01 B): Zeitraum mit ‹ ›, Summe mit Vergleich zum
 * Vormonat bzw. Vorjahr, 12 Monatsbalken und Kategoriezeilen. Tipp auf eine Kategorie öffnet die
 * Rechnungsliste gefiltert nach Kategorie und Zeitraum.
 */
@Component({
    selector: 'app-expenses',
    templateUrl: './expenses.component.html',
    styleUrls: ['./expenses.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [TimerangeSelectionComponent, LoadStateComponent, MonthlyBarsComponent, CategoryRowsComponent, DecimalPipe]
})
export class ExpensesComponent {
  private expenseContextService = inject(ExpenseContextService);
  private expenseApiService = inject(ExpenseApiService);
  private billContextService = inject(BillContextService);
  private router = inject(Router);

  readonly emptyText = 'Keine Ausgaben in diesem Zeitraum – erfasse Rechnungen unter Liste.';

  readonly availableTimeRange = toSignal(this.expenseContextService.availableTimeRange()
    .pipe(map(timeRange => timeRange ? mapTimeRangeDto(timeRange) : undefined)));

  readonly expenses = toSignal(this.expenseContextService.expenses());

  readonly selectedRange = signal<TimeRange | undefined>(undefined);

  private readonly comparison = signal<Comparison | null>(null);
  private readonly comparisonLoading = signal(false);
  private readonly comparisonError = signal(false);
  private readonly comparisonRequests = new Subject<TimeRange>();

  readonly loadState = computed<LoadState>(() => {
    if (this.expenseContextService.error() || this.comparisonError()) {
      return 'error';
    }

    const expenses = this.expenses();
    if (!this.selectedRange() || !expenses || this.expenseContextService.loading() || this.comparisonLoading()) {
      return 'loading';
    }

    return expenses.length > 0 ? 'ready' : 'empty';
  });

  readonly sum = computed(() => sumOf(this.expenses() ?? []));

  readonly previousExpenses = computed(() => this.comparison()?.previous ?? null);

  readonly months = computed(() => this.comparison()?.months ?? null);

  /** „+12 % zum Vormonat“; ohne Vorzeitraum (Gesamt, Benutzerdefiniert, Vorwert 0) kein Abzeichen */
  readonly totalChange = computed(() => {
    const comparison = this.comparison();
    const range = this.selectedRange();
    if (!comparison || !range) {
      return null;
    }

    const change = percentChange(this.sum(), sumOf(comparison.previous));
    if (change === null) {
      return null;
    }

    const reference = range.dateType === DateType.Year ? 'zum Vorjahr' : 'zum Vormonat';
    return {
      text: `${formatPercentChange(change)} ${reference}`,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
    };
  });

  /** Balken in Primärfarbe: der gewählte Monat ("YYYY-MM") bzw. alle Monate des gewählten Jahres ("YYYY") */
  readonly highlight = computed(() => {
    const range = this.selectedRange();
    if (!range) {
      return '';
    }

    return range.dateType === DateType.Year
      ? String(range.startDate.getFullYear())
      : formatDate(range.startDate, 'yyyy-MM', 'en-US');
  });

  constructor() {
    this.comparisonRequests.pipe(
      switchMap(range => this.loadComparison(range)),
      takeUntilDestroyed()
    ).subscribe(comparison => {
      this.comparison.set(comparison);
      this.comparisonLoading.set(false);
    });
  }

  timeSelectionChanged(timeRange: TimeRange): void {
    this.selectedRange.set(timeRange);
    this.expenseContextService.loadExpenses(timeRange);
    this.requestComparison(timeRange);
  }

  retry(): void {
    this.expenseContextService.retry();

    const range = this.selectedRange();
    if (range) {
      this.requestComparison(range);
    }
  }

  /** Rechnungsliste mit Kategorie- und Datumsfilter des gewählten Zeitraums; Summe dort = Summe hier */
  openCategory(category: string): void {
    const range = this.selectedRange();
    if (!range) {
      return;
    }

    const period = filterPeriod(range);
    this.billContextService.setSearchText('');
    this.billContextService.setCategoryFilter([category]);
    this.billContextService.setDateFilter(period.from, period.until);
    this.billContextService.searchBills();
    this.router.navigate(['/bill/list']);
  }

  private requestComparison(range: TimeRange): void {
    this.comparison.set(null);
    this.comparisonError.set(false);
    this.comparisonLoading.set(previousRange(range) !== null);
    this.comparisonRequests.next(range);
  }

  private loadComparison(range: TimeRange): Observable<Comparison | null> {
    const previous = previousRange(range);
    if (!previous) {
      return of(null);
    }

    return forkJoin({
      previous: this.expenseApiService.getExpenses(toRawRange(previous)),
      months: this.expenseApiService.getMonthlyExpenses(lastBarMonth(range), BAR_MONTHS)
    }).pipe(
      catchError(() => {
        this.comparisonLoading.set(false);
        this.comparisonError.set(true);
        return EMPTY;
      })
    );
  }
}

function sumOf(expenses: ExpenseDto[]): number {
  return Number(expenses.reduce((sum, expense) => sum + expense.costs, 0).toFixed(2));
}

function toRawRange(range: TimeRange): TimeRangeDtoRaw {
  return {
    startTimeUtc: formatDate(range.startDate, 'MM/dd/yyyy', 'en-US'),
    endTimeUtc: formatDate(range.endDate, 'MM/dd/yyyy', 'en-US')
  };
}

/** Monat: die 12 Monate bis zum gewählten; Jahr: Jänner bis Dezember des gewählten Jahres */
function lastBarMonth(range: TimeRange): string {
  return range.dateType === DateType.Year
    ? `${range.startDate.getFullYear()}-12`
    : formatDate(range.startDate, 'yyyy-MM', 'en-US');
}

/**
 * Datumsfilter der Rechnungsliste als lokale Kalendertage (Vertrag aus Task 9): ganzer Monat = 1. bis
 * Monatsletzter (Chip „November 2026“), Jahr = 01.01.–31.12., sonst Beginn und Ende des Zeitraums.
 */
function filterPeriod(range: TimeRange): { from: Date; until: Date } {
  const start = range.startDate;
  const end = range.endDate;

  if (range.dateType === DateType.Month) {
    return { from: new Date(start.getFullYear(), start.getMonth(), 1), until: new Date(start.getFullYear(), start.getMonth() + 1, 0) };
  }

  if (range.dateType === DateType.Year) {
    return { from: new Date(start.getFullYear(), 0, 1), until: new Date(start.getFullYear(), 11, 31) };
  }

  return {
    from: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
    until: new Date(end.getFullYear(), end.getMonth(), end.getDate())
  };
}