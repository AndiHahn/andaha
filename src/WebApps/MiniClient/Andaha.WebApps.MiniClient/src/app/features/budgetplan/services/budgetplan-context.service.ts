import { Injectable, Signal, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable, merge } from 'rxjs';
import { BudgetPlanApiService } from 'src/app/api/budgetplan/budgetplan-api.service';
import { BudgetPlanDto } from 'src/app/api/budgetplan/dtos/BudgetPlanDto';
import { ContextService } from 'src/app/core/context.service';
import { FixedCostContextService } from './fixed-cost-context.service';
import { IncomeContextService } from './income-context.service';

@Injectable({
  providedIn: 'root'
})
export class BudgetplanContextService {
  private contextService = inject(ContextService);
  private budgetPlanApiService = inject(BudgetPlanApiService);
  private incomeContextService = inject(IncomeContextService);
  private fixedCostContextService = inject(FixedCostContextService);

  private loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private budgetPlan$: BehaviorSubject<BudgetPlanDto | undefined> = new BehaviorSubject<BudgetPlanDto | undefined>(undefined);
  private readonly errorState = signal(false);
  private backendIsReady: boolean = false;
  /** Erst wer den Plan braucht, löst das Laden aus; vorher gibt es nichts neu zu laden */
  private loadRequested: boolean = false;

  /** true, wenn das letzte Laden fehlgeschlagen ist */
  readonly error: Signal<boolean> = this.errorState.asReadonly();

  constructor() {
    this.initSubscriptions();
  }

  /** Lädt beim ersten Aufruf genau einmal (sobald das Backend bereit ist), danach nur nach Änderungen (AC38) */
  budgetPlan(): Observable<BudgetPlanDto | undefined> {
    if (!this.loadRequested) {
      this.loadRequested = true;
      this.fetchWhenReady();
    }

    return this.budgetPlan$.asObservable();
  }

  loading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  /** Neu laden, z. B. nach „Erneut versuchen“ oder wenn sich Verbindungen geändert haben */
  refresh(): void {
    this.loadRequested = true;
    if (this.backendIsReady) {
      this.fetchBudgetPlan();
    } else {
      this.loading$.next(true);
      this.contextService.retryWakeUp();
    }
  }

  retry(): void {
    this.refresh();
  }

  private fetchWhenReady(): void {
    if (this.backendIsReady) {
      this.fetchBudgetPlan();
    } else {
      // Laden folgt in initSubscriptions, sobald das Backend bereit ist
      this.loading$.next(true);
    }
  }

  private fetchBudgetPlan() {
    this.loading$.next(true);
    this.errorState.set(false);

    this.budgetPlanApiService
      .getBudgetPlan()
      .subscribe(
        {
          next: result => {
            this.loading$.next(false);
            this.budgetPlan$.next(result);
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
          // backendReady kann mehrfach true melden; geladen wird nur beim Übergang
          if (ready && !this.backendIsReady) {
            this.backendIsReady = true;
            if (this.loadRequested) {
              this.fetchBudgetPlan();
            }
          }
        }
      }
    );

    // nur nach der Server-Antwort, nicht schon beim optimistischen Entfernen
    merge(this.incomeContextService.changed(), this.fixedCostContextService.changed()).subscribe(
      {
        next: () => {
          if (this.loadRequested && this.backendIsReady) {
            this.fetchBudgetPlan();
          }
        }
      }
    );
  }
}
