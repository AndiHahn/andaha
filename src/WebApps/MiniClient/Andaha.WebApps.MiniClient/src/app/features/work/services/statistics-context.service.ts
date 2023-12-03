import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TimeRangeDto } from 'src/app/api/common-dtos/TimeRangeDto';
import { StatisticsDto } from 'src/app/api/work/dtos/StatisticsDto';
import { StatisticsApiService } from 'src/app/api/work/statistics-api.service';
import { ContextService } from 'src/app/core/context.service';
import { TimeRange } from 'src/app/shared/models/TimeRange';

@Injectable({
  providedIn: 'root'
})
export class StatisticsContextService {
  private loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private availableTimeRange$: BehaviorSubject<TimeRangeDto | undefined> = new BehaviorSubject<TimeRangeDto | undefined>(undefined);
  private statistics$: BehaviorSubject<StatisticsDto | undefined> = new BehaviorSubject<StatisticsDto | undefined>(undefined);
  
  constructor(
    private contextService: ContextService,
    private apiService: StatisticsApiService
  ) {
    this.initSubscriptions();
    this.fetchTimeRange();
  }

  availableTimeRange(): Observable<TimeRangeDto | undefined> {
    return this.availableTimeRange$.asObservable();
  }

  statistics(): Observable<StatisticsDto | undefined> {
    return this.statistics$.asObservable();
  }

  loading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  loadStatistics(timeRange: TimeRange): void {
    this.fetchStatistics(
      //this.datePipe.transform(timeRange.startDate, 'MM/dd/yyyy')!,
      //this.datePipe.transform(timeRange.endDate, 'MM/dd/yyyy')!
      timeRange.startDate,
      timeRange.endDate
    );
  }

  private fetchTimeRange(): void {
    this.apiService.getAvailableTimeRange().subscribe(
      {
        next: timeRange => this.availableTimeRange$.next(timeRange)
      }
    );
  }

  private fetchStatistics(
    startTimeUtc: Date,
    endTimeUtc: Date
  ) {
    this.loading$.next(true);

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
          error: _ => this.loading$.next(false)
        }
    );
  }

  private initSubscriptions(): void {
    this.contextService.backendReady().subscribe(
      {
        next: ready => {
          if (ready) {
            this.fetchTimeRange();
          }
        }
      }
    );
  }
}
