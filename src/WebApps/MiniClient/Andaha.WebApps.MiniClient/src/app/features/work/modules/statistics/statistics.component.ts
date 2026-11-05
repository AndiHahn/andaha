import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { DecimalPipe, Time, formatDate } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EMPTY, Subject, catchError, map, switchMap } from 'rxjs';
import { TimeRange, mapTimeRangeDto } from 'src/app/shared/models/TimeRange';
import { StatisticsContextService } from '../../services/statistics-context.service';
import { PersonContextService } from '../../services/person-context.service';
import { createTimeDisplayName } from '../../functions/date-time-functions';
import { DateType } from 'src/app/features/bill/modules/expenses/timerange-selection/DateType';
import { TimerangeSelectionComponent } from '../../../bill/modules/expenses/timerange-selection/timerange-selection.component';
import { MonthlyBarsComponent } from '../../../bill/modules/expenses/monthly-bars/monthly-bars.component';
import { MonthlyHoursDto } from 'src/app/api/work/dtos/MonthlyHoursDto';
import { StatisticsApiService } from 'src/app/api/work/statistics-api.service';
import { PersonApiService } from 'src/app/api/work/person-api.service';
import { PageTitleService } from 'src/app/core/page-title/page-title.service';
import { LoadState, LoadStateComponent } from 'src/app/shared/load-state/load-state.component';
import { getFileName, shareOrDownload } from 'src/app/shared/utils/file-utils';

@Component({
    selector: 'app-statistics',
    templateUrl: './statistics.component.html',
    styleUrls: ['./statistics.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [TimerangeSelectionComponent, LoadStateComponent, MonthlyBarsComponent, DecimalPipe, RouterLink]
})
export class StatisticsComponent implements OnInit, OnDestroy {
  private contextService = inject(StatisticsContextService);
  private personContextService = inject(PersonContextService);
  private statisticsApiService = inject(StatisticsApiService);
  private personApiService = inject(PersonApiService);
  private pageTitleService = inject(PageTitleService);
  private destroyRef = inject(DestroyRef);

  readonly emptyText = 'Noch keine Arbeitszeiten – erfasse sie unter Personen.';
  readonly dateType = DateType;

  readonly availableTimeRange = toSignal(this.contextService.availableTimeRange()
    .pipe(map(timeRange => timeRange ? mapTimeRangeDto(timeRange) : undefined)));
  readonly statistics = toSignal(this.contextService.statistics());
  readonly fullStatistics = toSignal(this.contextService.fullStatistics());
  private readonly isLoading = toSignal(this.contextService.loading(), { initialValue: false });
  readonly persons = toSignal(this.personContextService.persons());

  readonly selectedRange = signal<TimeRange | undefined>(undefined);
  /** Einfachauswahl; null = „Alle“ */
  readonly selectedPersonId = signal<string | null>(null);

  private readonly monthlyHours = signal<MonthlyHoursDto[] | null>(null);
  private readonly monthlyLoading = signal(false);
  private readonly monthlyError = signal(false);
  private readonly monthlyRequests = new Subject<{ range: TimeRange; personIds: string[] } | null>();

  readonly isTotal = computed(() => this.selectedRange()?.dateType === DateType.Total);

  /** Werte des aktuellen Zeitraums; Gesamt hat eigene Kennzahlen */
  private readonly hasData = computed(() => this.isTotal() ? !!this.fullStatistics() : !!this.statistics());

  readonly loadState = computed<LoadState>(() => {
    if (this.contextService.error() || this.monthlyError()) {
      return 'error';
    }

    if (!this.availableTimeRange() || !this.selectedRange() || this.isLoading() || this.monthlyLoading() || !this.hasData()) {
      return 'loading';
    }

    const total = this.isTotal() ? this.fullStatistics()!.totalWorkingTime : this.statistics()!.totalWorkingTime;
    return total.hours === 0 && total.minutes === 0 ? 'empty' : 'ready';
  });

  /** Balkenwerte der Stunden; die Balkenkomponente liest sie aus `costs` */
  readonly bars = computed(() => this.monthlyHours()?.map(entry => ({ month: entry.month, costs: entry.hours })) ?? null);

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
    this.monthlyRequests.pipe(
      switchMap(request => request === null ? EMPTY : this.statisticsApiService.getMonthlyHours(lastBarMonth(request.range), BAR_MONTHS, request.personIds).pipe(
        catchError(() => {
          this.monthlyLoading.set(false);
          this.monthlyError.set(true);
          return EMPTY;
        })
      )),
      takeUntilDestroyed()
    ).subscribe(hours => {
      this.monthlyHours.set(hours);
      this.monthlyLoading.set(false);
    });
  }

  ngOnInit(): void {
    this.pageTitleService.setAction({ icon: 'ios_share', label: 'Exportieren', run: () => this.exportPersons() });
  }

  ngOnDestroy(): void {
    this.pageTitleService.setAction(null);
  }

  timeSelectionChanged(timeRange: TimeRange): void {
    this.selectedRange.set(timeRange);
    this.reload();
  }

  selectPerson(personId: string | null): void {
    if (this.selectedPersonId() === personId) {
      return;
    }

    this.selectedPersonId.set(personId);
    this.reload();
  }

  retry(): void {
    this.contextService.retry();

    if (this.monthlyError()) {
      this.reload();
    }
  }

  getTimeDisplayString(time: Time): string {
    return createTimeDisplayName(time);
  }

  /** Personen-Export teilen bzw. herunterladen (AC21) */
  private exportPersons(): void {
    this.personApiService.export().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(response => {
      if (response.body) {
        void shareOrDownload(response.body, getFileName(response.headers), response.body.type);
      }
    });
  }

  private reload(): void {
    const range = this.selectedRange();
    if (!range) {
      return;
    }

    const personId = this.selectedPersonId();
    const personIds = personId ? [personId] : [];
    this.contextService.load(range, personIds);
    this.requestMonthlyHours(range, personIds);
  }

  /** Diagramm nur bei Monat und Jahr; alte Balken sofort verwerfen */
  private requestMonthlyHours(range: TimeRange, personIds: string[]): void {
    this.monthlyHours.set(null);
    this.monthlyError.set(false);

    const withChart = range.dateType === DateType.Month || range.dateType === DateType.Year;
    this.monthlyLoading.set(withChart);
    // null verwirft eine noch laufende Anfrage des vorigen Zeitraums
    this.monthlyRequests.next(withChart ? { range, personIds } : null);
  }
}

const BAR_MONTHS = 12;

/** Monat: die 12 Monate bis zum gewählten; Jahr: Jänner bis Dezember des gewählten Jahres */
function lastBarMonth(range: TimeRange): string {
  return range.dateType === DateType.Year
    ? `${range.startDate.getFullYear()}-12`
    : formatDate(range.startDate, 'yyyy-MM', 'en-US');
}
