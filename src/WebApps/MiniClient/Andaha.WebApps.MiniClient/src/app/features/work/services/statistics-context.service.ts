import { Injectable, Signal, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { DateType } from 'src/app/features/bill/modules/expenses/timerange-selection/DateType';
import { TimeRangeDto } from 'src/app/api/common-dtos/TimeRangeDto';
import { FullStatisticsDto } from 'src/app/api/work/dtos/FullStatisticsDto';
import { StatisticsDto } from 'src/app/api/work/dtos/StatisticsDto';
import { StatisticsApiService } from 'src/app/api/work/statistics-api.service';
import { ContextService } from 'src/app/core/context.service';
import { TimeRange } from 'src/app/shared/models/TimeRange';

@Injectable({
  providedIn: 'root'
})
export class StatisticsContextService {
  private contextService = inject(ContextService);
  private apiService = inject(StatisticsApiService);

  private loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  /** undefined = noch nicht geladen, null = Konto ohne Arbeitszeiten */
  private availableTimeRange$ = new BehaviorSubject<TimeRangeDto | null | undefined>(undefined);
  private statistics$: BehaviorSubject<StatisticsDto | undefined> = new BehaviorSubject<StatisticsDto | undefined>(undefined);
  private fullStatistics$: BehaviorSubject<FullStatisticsDto | undefined> = new BehaviorSubject<FullStatisticsDto | undefined>(undefined);
  private readonly errorState = signal(false);
  /** Das zuletzt angeforderte Laden, für „Erneut versuchen“ */
  private lastLoad?: () => void;
  private pending?: Subscription;
  private backendIsReady: boolean = false;

  /** true, wenn das Laden des Zeitraums oder zuletzt der Statistik fehlgeschlagen ist */
  readonly error: Signal<boolean> = this.errorState.asReadonly();

  constructor() {
    this.initSubscriptions();
    this.fetchTimeRange();
  }

  availableTimeRange(): Observable<TimeRangeDto | null | undefined> {
    return this.availableTimeRange$.asObservable();
  }

  statistics(): Observable<StatisticsDto | undefined> {
    return this.statistics$.asObservable();
  }

  fullStatistics(): Observable<FullStatisticsDto | undefined> {
    return this.fullStatistics$.asObservable();
  }

  loading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  /**
   * Statistik für Zeitraum und Personen laden (leer = alle). Die Werte des vorigen Zeitraums bzw. der
   * vorigen Person werden sofort geleert und der Ladezustand gesetzt (AC39); Gesamt lädt die Gesamtstatistik.
   */
  load(range: TimeRange, personIds: string[]): void {
    this.statistics$.next(undefined);
    this.fullStatistics$.next(undefined);

    this.lastLoad = range.dateType === DateType.Total
      ? () => this.fetchFullStatistics(personIds)
      : () => this.fetchStatistics(range.startDate, range.endDate, personIds);
    this.lastLoad();
  }

  /** Zeitraum und die zuletzt angeforderte Statistik erneut laden */
  retry(): void {
    if (!this.backendIsReady) {
      this.contextService.retryWakeUp();
      return;
    }

    this.errorState.set(false);
    if (!this.availableTimeRange$.value) {
      this.fetchTimeRange();
    }
    this.lastLoad?.();
  }

  /** Verfügbaren Zeitraum neu laden, z. B. nach dem Speichern einer Arbeitszeit (AC39) */
  refreshTimeRange(): void {
    this.fetchTimeRange();
  }

  private fetchTimeRange(): void {
    this.apiService.getAvailableTimeRange().subscribe(
      {
        next: timeRange => this.availableTimeRange$.next(timeRange),
        error: _ => {
          // ohne Zeitraum kann die Seite nichts laden: Fehlerzustand statt endlosem Spinner
          if (this.backendIsReady && this.availableTimeRange$.value === undefined) {
            this.loading$.next(false);
            this.errorState.set(true);
          }
        }
      }
    );
  }

  private fetchStatistics(
    startTimeUtc: Date,
    endTimeUtc: Date,
    personIds: string[]
  ) {
    this.loading$.next(true);
    this.errorState.set(false);

    // eine überholte Antwort darf die neue Auswahl nicht überschreiben
    this.pending?.unsubscribe();
    this.pending = this.apiService
      .getStatistics(
        startTimeUtc,
        endTimeUtc,
        personIds
      )
      .subscribe(
        {
          next: result => {
            this.loading$.next(false);
            this.statistics$.next(result);
          },
          error: _ => {
            this.loading$.next(false);
            this.errorState.set(true);
          }
        }
    );
  }

  private fetchFullStatistics(personIds: string[]) {
    this.loading$.next(true);
    this.errorState.set(false);

    this.pending?.unsubscribe();
    this.pending = this.apiService
      .getFullStatistics(personIds)
      .subscribe(
        {
          next: result => {
            this.loading$.next(false);
            this.fullStatistics$.next(result);
          },
          error: _ => {
            this.loading$.next(false);
            this.errorState.set(true);
          }
        }
    );
  }

  private initSubscriptions(): void {
    this.contextService.backendReady().subscribe(
      {
        next: ready => {
          this.backendIsReady = ready;
          if (ready) {
            this.fetchTimeRange();
          }
        }
      }
    );
  }
}
