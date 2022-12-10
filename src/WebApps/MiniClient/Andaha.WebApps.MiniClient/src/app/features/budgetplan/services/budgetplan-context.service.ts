import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BudgetPlanApiService } from 'src/app/api/budgetplan/budgetplan-api.service';
import { BudgetPlanDto } from 'src/app/api/budgetplan/dtos/BudgetPlanDto';
import { ContextService } from 'src/app/core/context.service';
import { FixedCostContextService } from './fixed-cost-context.service';
import { IncomeContextService } from './income-context.service';

@Injectable({
  providedIn: 'root'
})
export class BudgetplanContextService {

  private loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private budgetPlan$: BehaviorSubject<BudgetPlanDto | undefined> = new BehaviorSubject<BudgetPlanDto | undefined>(undefined);
  
  constructor(
    private contextService: ContextService,
    private budgetPlanApiService: BudgetPlanApiService,
    private incomeContextService: IncomeContextService,
    private fixedCostContextService: FixedCostContextService
  ) {
    this.fetchBudgetPlan();
    this.initSubscriptions();
  }

  budgetPlan(): Observable<BudgetPlanDto | undefined> {
    return this.budgetPlan$.asObservable();
  }

  loading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  private fetchBudgetPlan() {
    this.loading$.next(true);

    this.budgetPlanApiService
      .getBudgetPlan()
      .subscribe(
        {
          next: result => {
            this.loading$.next(false);
            this.budgetPlan$.next(result);
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
            this.fetchBudgetPlan();
          }
        } 
      }
    );

    this.incomeContextService.incomes().subscribe(
      {
        next: result => {
          if (result) {
            this.fetchBudgetPlan();
          }
        }
      }
    );

    this.fixedCostContextService.fixedCosts().subscribe(
      {
        next: result => {
          if (result) {
            this.fetchBudgetPlan();
          }
        }
      }
    );
  }
}
