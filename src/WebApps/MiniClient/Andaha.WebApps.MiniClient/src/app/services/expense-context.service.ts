import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ExpenseDto } from '../api/shopping/dtos/ExpenseDto';
import { TimeRangeDto, TimeRangeDtoRaw } from '../api/shopping/dtos/TimeRangeDto';
import { ExpenseApiService } from '../api/shopping/expense-api.service';
import { ContextService } from '../core/context.service';
import { TimeRange } from '../features/bill/modules/expenses/timerange-selection/TimeRange';

@Injectable({
  providedIn: 'root'
})
export class ExpenseContextService {
  private availableTimeRange$: BehaviorSubject<TimeRangeDto | undefined> = new BehaviorSubject<TimeRangeDto | undefined>(undefined);
  private expenses$ : BehaviorSubject<ExpenseDto[] | undefined> = new BehaviorSubject<ExpenseDto[] | undefined>(undefined);

  constructor(
    private contextService: ContextService,
    private apiService: ExpenseApiService,
    private datePipe: DatePipe
  ) {
    this.initSubscriptions();
    this.fetchTimeRange();
  }

  availableTimeRange(): Observable<TimeRangeDto | undefined> {
    return this.availableTimeRange$.asObservable();
  }

  expenses(): Observable<ExpenseDto[] | undefined> {
    return this.expenses$.asObservable();
  }

  loadExpenses(timeRange: TimeRange): void {
    this.fetchExpenses(
      {
        startTimeUtc: this.datePipe.transform(timeRange.startDate, 'MM/dd/yyyy')!,
        endTimeUtc: this.datePipe.transform(timeRange.endDate, 'MM/dd/yyyy')!
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

  private fetchTimeRange(): void {
    this.apiService.getAvailableTimeRange().subscribe(
      {
        next: timeRange => this.availableTimeRange$.next(timeRange)
      }
    );
  }

  private fetchExpenses(timeRange: TimeRangeDtoRaw): void {
    this.apiService.getExpenses(timeRange).subscribe(
      {
        next: expenses => this.expenses$.next(expenses)
      }
    );
  }
}
