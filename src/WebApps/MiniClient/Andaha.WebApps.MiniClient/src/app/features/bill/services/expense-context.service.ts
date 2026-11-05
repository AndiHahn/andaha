import { DatePipe } from '@angular/common';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, from, throwError } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { ExpenseDto } from '../../../api/shopping/dtos/ExpenseDto';
import { TimeRangeDto, TimeRangeDtoRaw } from '../../../api/common-dtos/TimeRangeDto';
import { ExpenseApiService } from '../../../api/shopping/expense-api.service';
import { ContextService } from '../../../core/context.service';
import { TimeRange } from '../../../shared/models/TimeRange';
import { BillContextService } from './bill-context.service';
import { ShareOrDownloadResult, XLSX_MIME_TYPE, getFileName, shareOrDownload } from 'src/app/shared/utils/file-utils';

@Injectable({
  providedIn: 'root'
})
export class ExpenseContextService {
  private billContextService = inject(BillContextService);
  private contextService = inject(ContextService);
  private apiService = inject(ExpenseApiService);
  private datePipe = inject(DatePipe);

  private availableTimeRange$: BehaviorSubject<TimeRangeDto | undefined> = new BehaviorSubject<TimeRangeDto | undefined>(undefined);
  private expenses$ : BehaviorSubject<ExpenseDto[] | undefined> = new BehaviorSubject<ExpenseDto[] | undefined>(undefined);
  private readonly loadingState = signal(false);
  private readonly errorState = signal(false);
  private lastTimeRange?: TimeRange;
  private expensesRequest?: Subscription;
  private backendIsReady: boolean = false;

  /** true, solange Ausgaben für einen Zeitraum geladen werden */
  readonly loading: Signal<boolean> = this.loadingState.asReadonly();
  /** true, wenn das Laden des Zeitraums oder zuletzt der Ausgaben fehlgeschlagen ist */
  readonly error: Signal<boolean> = this.errorState.asReadonly();

  constructor() {
    this.initSubscriptions();
    this.fetchTimeRange();
  }

  availableTimeRange(): Observable<TimeRangeDto | undefined> {
    return this.availableTimeRange$.asObservable();
  }

  expenses(): Observable<ExpenseDto[] | undefined> {
    return this.expenses$.asObservable();
  }

  /**
   * Exportiert die Ausgaben des Zeitraums (leere Kategorienamen = alle) und teilt bzw. lädt die Datei.
   * Fehler (auch beim Teilen) gehen an den Aufrufer, der eine eigene Meldung zeigt (SKIP_GLOBAL_ERROR).
   */
  downloadExpenses(start: Date, end: Date, categoryNames: string[] = []): Observable<ShareOrDownloadResult> {
    return this.apiService.exportExpenses(start, end, categoryNames).pipe(
      take(1),
      switchMap(response => response.body
        ? from(shareOrDownload(response.body, getFileName(response.headers), XLSX_MIME_TYPE))
        : throwError(() => new Error('Export without content')))
    );
  }

  loadExpenses(timeRange: TimeRange): void {
    this.lastTimeRange = timeRange;
    this.fetchExpenses(
      {
        startTimeUtc: this.datePipe.transform(timeRange.startDate, 'MM/dd/yyyy')!,
        endTimeUtc: this.datePipe.transform(timeRange.endDate, 'MM/dd/yyyy')!
      }
    );
  }

  /** Zeitraum (falls noch nicht geladen) und die zuletzt angeforderten Ausgaben erneut laden */
  retry(): void {
    if (!this.backendIsReady) {
      this.contextService.retryWakeUp();
      return;
    }

    this.errorState.set(false);
    if (!this.availableTimeRange$.value) {
      this.fetchTimeRange();
    }
    if (this.lastTimeRange) {
      this.loadExpenses(this.lastTimeRange);
    }
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
        next: timeRange => this.availableTimeRange$.next(timeRange),
        error: _ => {
          // ohne Zeitraum kann die Seite nichts laden: Fehlerzustand statt endlosem Spinner
          if (this.backendIsReady && !this.availableTimeRange$.value) {
            this.loadingState.set(false);
            this.errorState.set(true);
          }
        }
      }
    );
  }

  private fetchExpenses(timeRange: TimeRangeDtoRaw): void {
    this.loadingState.set(true);
    this.errorState.set(false);

    // nur die letzte Anfrage zählt: beim schnellen Blättern mit ‹ › darf keine ältere Antwort gewinnen
    this.expensesRequest?.unsubscribe();
    this.expensesRequest = this.apiService.getExpenses(timeRange).subscribe(
      {
        next: expenses => {
          this.loadingState.set(false);
          this.expenses$.next(expenses);
        },
        error: _ => {
          this.loadingState.set(false);
          this.errorState.set(true);
        }
      }
    );
  }
}
