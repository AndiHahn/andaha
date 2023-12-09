import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ExpenseDto } from '../../../api/shopping/dtos/ExpenseDto';
import { TimeRangeDto, TimeRangeDtoRaw } from '../../../api/common-dtos/TimeRangeDto';
import { ExpenseApiService } from '../../../api/shopping/expense-api.service';
import { ContextService } from '../../../core/context.service';
import { TimeRange } from '../../../shared/models/TimeRange';
import { BillContextService } from './bill-context.service';
import { downloadFile, getFileName } from 'src/app/shared/utils/file-utils';

@Injectable({
  providedIn: 'root'
})
export class ExpenseContextService {
  private availableTimeRange$: BehaviorSubject<TimeRangeDto | undefined> = new BehaviorSubject<TimeRangeDto | undefined>(undefined);
  private expenses$ : BehaviorSubject<ExpenseDto[] | undefined> = new BehaviorSubject<ExpenseDto[] | undefined>(undefined);

  constructor(
    private billContextService: BillContextService,
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

  downloadExpenses(): Observable<void> {
    const returnSubject = new Subject<void>();

    this.availableTimeRange().subscribe(
      {
        next: timeRange => {
          if (!timeRange) {
            returnSubject.next();

            return;
          }

          this.apiService
            .exportExpenses(
              {
                startTimeUtc: this.datePipe.transform(timeRange.startTimeUtc, 'MM/dd/yyyy')!,
                endTimeUtc: this.datePipe.transform(timeRange.endTimeUtc, 'MM/dd/yyyy')!
              }
            )
            .subscribe(
              {
                next: response => {
                  if (!response || !response.body) {
                    returnSubject.next();

                    return;
                  }

                  downloadFile(
                    response.body,
                    getFileName(response.headers),
                    response.body.type);

                  returnSubject.next();
                },
                error: error => returnSubject.error(error)
              }
            );
        },
        error: error => returnSubject.error(error)
      }
    );

    return returnSubject;
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

    this.billContextService.bills().subscribe(
      {
        next: bills => {
          if (bills.length > 0) {
            const firstBill = bills[0];
            const lastBill = bills[bills.length - 1];

            if (!this.availableTimeRange$.value) {
              this.availableTimeRange$.next({
                startTimeUtc: lastBill.date,
                endTimeUtc: firstBill.date
              });

              return;
            }

            var startTime = this.availableTimeRange$.value.startTimeUtc;
            var endTime = this.availableTimeRange$.value.endTimeUtc;
            
            if (firstBill.date > endTime || lastBill.date < startTime) {
              this.availableTimeRange$.next({
                startTimeUtc: lastBill.date < startTime ? lastBill.date : startTime,
                endTimeUtc: firstBill.date > endTime ? firstBill.date : endTime
              });
            }
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
