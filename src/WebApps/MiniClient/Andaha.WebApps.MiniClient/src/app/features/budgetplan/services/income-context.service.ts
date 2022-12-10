import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { IncomeCreateDto } from 'src/app/api/budgetplan/dtos/IncomeCreateDto';
import { IncomeDto } from 'src/app/api/budgetplan/dtos/IncomeDto';
import { IncomeUpdateDto } from 'src/app/api/budgetplan/dtos/IncomeUpdateDto';
import { IncomeApiService } from 'src/app/api/budgetplan/income-api.service';
import { ContextService } from 'src/app/core/context.service';

@Injectable({
  providedIn: 'root'
})
export class IncomeContextService {
  private loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private incomes$: BehaviorSubject<IncomeDto[] | undefined> = new BehaviorSubject<IncomeDto[] | undefined>(undefined);
  
  constructor(
    private contextService: ContextService,
    private incomeApiService: IncomeApiService
  ) {
    this.fetchIncomes();
    this.initSubscriptions();
  }

  incomes(): Observable<IncomeDto[] | undefined> {
    return this.incomes$.asObservable();
  }

  loading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  getById(id: string): IncomeDto | undefined {
    return this.incomes$.value?.find(cost => cost.id == id);
  }

  createIncome(dto: IncomeCreateDto): Observable<void> {
    const returnSubject = new Subject<void>();

    this.incomeApiService.create(dto).subscribe(
      {
        next: _ => {
          returnSubject.next();
          this.fetchIncomes();
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
        next: _ => returnSubject.next(),
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

    this.incomeApiService
      .list()
      .subscribe(
        {
          next: result => {
            this.loading$.next(false);
            this.incomes$.next(result);
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
            this.fetchIncomes();
          }
        } 
      }
    );
  }
}
