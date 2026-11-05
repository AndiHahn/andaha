import { Injectable, Signal, inject, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import { afterFirstLoad } from 'src/app/shared/utils/load-state';
import { IncomeCreateDto } from 'src/app/api/budgetplan/dtos/IncomeCreateDto';
import { IncomeDto } from 'src/app/api/budgetplan/dtos/IncomeDto';
import { IncomeUpdateDto } from 'src/app/api/budgetplan/dtos/IncomeUpdateDto';
import { IncomeApiService } from 'src/app/api/budgetplan/income-api.service';
import { ContextService } from 'src/app/core/context.service';

@Injectable({
  providedIn: 'root'
})
export class IncomeContextService {
  private contextService = inject(ContextService);
  private incomeApiService = inject(IncomeApiService);

  private loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private incomes$: BehaviorSubject<IncomeDto[] | undefined> = new BehaviorSubject<IncomeDto[] | undefined>(undefined);
  private loadState$ = new ReplaySubject<'loaded' | 'failed'>(1);
  private changed$ = new Subject<void>();
  private readonly errorState = signal(false);
  private backendIsReady: boolean = false;

  /** true, wenn das letzte Laden der Liste fehlgeschlagen ist (nachdem das Backend bereit war) oder das Backend nicht erreichbar ist */
  readonly error: Signal<boolean> = computed(() => this.errorState() || this.contextService.backendUnreachable());

  constructor() {
    this.fetchIncomes();
    this.initSubscriptions();
  }

  incomes(): Observable<IncomeDto[] | undefined> {
    return this.incomes$.asObservable();
  }

  loading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  /** Meldet jede vom Server bestätigte Änderung (Anlegen, Ändern, Löschen); nie beim optimistischen Entfernen */
  changed(): Observable<void> {
    return this.changed$.asObservable();
  }

  /** Liste erneut laden (bzw. Backend erneut wecken, solange es nicht bereit ist) */
  retry(): void {
    if (this.backendIsReady) {
      this.fetchIncomes();
    } else {
      this.contextService.retryWakeUp();
    }
  }

  getById(id: string): IncomeDto | undefined {
    return this.incomes$.value?.find(cost => cost.id == id);
  }

  byId(id: string): Observable<IncomeDto | undefined> {
    return afterFirstLoad(this.loadState$, () => this.getById(id));
  }

  createIncome(dto: IncomeCreateDto): Observable<void> {
    const returnSubject = new Subject<void>();

    this.incomeApiService.create(dto).subscribe(
      {
        next: _ => {
          returnSubject.next();
          this.fetchIncomes();
          this.changed$.next();
        },
        error: error => returnSubject.error(error)
      }
    );

    return returnSubject.asObservable();
  }

  updateIncome(id: string, dto: IncomeUpdateDto): Observable<void> {
    const returnSubject = new Subject<void>();

    this.incomeApiService.update(id, dto).subscribe(
      {
        next: _ => {
          returnSubject.next();
          this.fetchIncomes();
          this.changed$.next();
        },
        error: error => returnSubject.error(error)
      }
    );

    return returnSubject.asObservable();
  }

  deleteIncome(id: string): Observable<void> {
    const returnSubject = new Subject<void>();

    const incomesWithoutDeleted = this.incomes$.value?.filter(cost => cost.id != id);
    
    this.incomes$.next(incomesWithoutDeleted);

    this.incomeApiService.delete(id).subscribe(
      {
        next: _ => {
          returnSubject.next();
          this.changed$.next();
        },
        error: error => {
          returnSubject.error(error);
          this.fetchIncomes();
        } 
      }
    );

    return returnSubject.asObservable();
  }

  private fetchIncomes() {
    this.loading$.next(true);
    this.errorState.set(false);

    this.incomeApiService
      .list()
      .subscribe(
        {
          next: result => {
            this.loading$.next(false);
            this.incomes$.next(result);
            this.loadState$.next('loaded');
          },
          error: _ => {
            this.loading$.next(false);
            if (this.backendIsReady) {
              this.errorState.set(true);
              this.loadState$.next('failed');
            }
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
            this.fetchIncomes();
          }
        } 
      }
    );
  }
}
