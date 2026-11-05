import { Injectable, Signal, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
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
  private availableTimeRange$: BehaviorSubject<TimeRangeDto | undefined> = new BehaviorSubject<TimeRangeDto | undefined>(undefined);
  private statistics$: BehaviorSubject<StatisticsDto | undefined> = new BehaviorSubject<StatisticsDto | undefined>(undefined);
  private fullStatistics$: BehaviorSubject<FullStatisticsDto | undefined> = new BehaviorSubject<FullStatisticsDto | undefined>(undefined);
  private readonly errorState = signal(false);
  /** Das zuletzt angeforderte Laden, für „Erneut versuchen“ */
  private lastLoad?: () => void;
  private backendIsReady: boolean = false;

  /** true, wenn das Laden des Zeitraums oder zuletzt der Statistik fehlgeschlagen ist */
  readonly error: Signal<boolean> = this.errorState.asReadonly();

  constructor() {
    this.initSubscriptions();
    this.fetchTimeRange();
  }

  availableTimeRange(): Observable<TimeRangeDto | undefined> {
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

  loadStatistics(timeRange: TimeRange): void {
    this.lastLoad = () => this.fetchStatistics(timeRange.startDate, timeRange.endDate);
    this.lastLoad();
  }

  loadFullStatistics(): void {
    this.lastLoad = () => this.fetchFullStatistics();
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

  private fetchTimeRange(): void {
    this.apiService.getAvailableTimeRange().subscribe(
      {
        next: timeRange => this.availableTimeRange$.next(timeRange),
        error: _ => {
          // ohne Zeitraum kann die Seite nichts laden: Fehlerzustand statt endlosem Spinner
          if (this.backendIsReady && !this.availableTimeRange$.value) {
            this.loading$.next(false);
            this.errorState.set(true);
          }
        }
      }
    );
  }

  private fetchStatistics(
    startTimeUtc: Date,
    endTimeUtc: Date
  ) {
    this.loading$.next(true);
    this.errorState.set(false);

    this.apiService
      .getStatistics(
        startTimeUtc,
        endTimeUtc,
        undefined
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

  private fetchFullStatistics() {
    this.loading$.next(true);
    this.errorState.set(false);

    this.apiService
      .getFullStatistics(undefined)
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
