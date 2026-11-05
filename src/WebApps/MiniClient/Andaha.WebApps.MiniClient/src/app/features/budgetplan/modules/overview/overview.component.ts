import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BudgetPlanDto } from 'src/app/api/budgetplan/dtos/BudgetPlanDto';
import { CostCategoryLabel } from 'src/app/api/budgetplan/dtos/CostCategory';
import { BudgetplanContextService } from '../../services/budgetplan-context.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { DecimalPipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { BudgetPlanApiService } from 'src/app/api/budgetplan/budgetplan-api.service';
import { SheetService } from 'src/app/core/overlay/sheet.service';
import { LoadState, LoadStateComponent } from 'src/app/shared/load-state/load-state.component';
import { LivingCostSheetComponent, LivingCostSheetData } from './living-cost-sheet/living-cost-sheet.component';

/** Desktop-Breakpoint wie AppComponent */
const DESKTOP = '(min-width: 1024px)';

@Component({
    selector: 'app-overview',
    templateUrl: './overview.component.html',
    styleUrls: ['./overview.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [DecimalPipe, RouterLink, MatIcon, LoadStateComponent]
})
export class OverviewComponent implements OnInit {
  private budgetPlanContextService = inject(BudgetplanContextService);
  private budgetPlanApiService = inject(BudgetPlanApiService);
  private sheet = inject(SheetService);
  private dialog = inject(MatDialog);
  private breakpoints = inject(BreakpointObserver);
  private destroyRef = inject(DestroyRef);

  readonly contextError = this.budgetPlanContextService.error;

  budgetPlan?: BudgetPlanDto;

  /** Gespeicherter Anteil in ganzen Prozent; undefined bis die Einstellungen geladen sind */
  livingCostShare?: number;
  settingsError = false;

  livingCosts: number = 0;

  monthlySurplus: number = 0;
  monthlyExpensesPercent: number = 0;
  monthlySurplusPercent: number = 0;

  costCategoryLabel = CostCategoryLabel;

  ngOnInit(): void {
    this.initSubscriptions();
    this.loadSettings();
  }

  get loadState(): LoadState {
    if (this.contextError() || this.settingsError) {
      return 'error';
    }

    return this.budgetPlan && this.livingCostShare !== undefined ? 'ready' : 'loading';
  }

  retry(): void {
    if (this.contextError()) {
      this.budgetPlanContextService.retry();
    }
    if (this.settingsError || this.livingCostShare === undefined) {
      this.loadSettings();
    }
  }

  openLivingCostSheet(): void {
    if (!this.budgetPlan || this.livingCostShare === undefined) {
      return;
    }

    const data: LivingCostSheetData = { income: this.budgetPlan.income, share: this.livingCostShare };
    const dismissed$ = this.breakpoints.isMatched(DESKTOP)
      ? this.dialog.open<LivingCostSheetComponent, LivingCostSheetData, number | undefined>(LivingCostSheetComponent, {
        data,
        panelClass: ['andaha-dialog', 'living-cost-dialog'],
        width: '480px',
        maxWidth: 'calc(100vw - 32px)',
        ariaLabel: 'Lebenserhaltungskosten'
      }).afterClosed()
      : this.sheet.open<LivingCostSheetComponent, LivingCostSheetData, number | undefined>(LivingCostSheetComponent, {
        data,
        panelClass: 'living-cost-sheet',
        ariaLabel: 'Lebenserhaltungskosten'
      }).afterDismissed();

    dismissed$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(share => {
      if (share !== undefined) {
        this.livingCostShare = share;
        this.recalculate();
      }
    });
  }

  // Nur Anzeige: Balkenbreiten aus denselben Prozentwerten wie der frühere mat-progress-bar, auf 0–100 % begrenzt
  get expensesBarWidth(): number {
    return this.clampPercent(this.monthlyExpensesPercent);
  }

  get surplusBarWidth(): number {
    return this.clampPercent(this.monthlySurplusPercent);
  }

  private clampPercent(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.min(100, Math.max(0, value));
  }

  private recalculate(): void {
    if (!this.budgetPlan || this.livingCostShare === undefined) {
      return;
    }

    this.livingCosts = Math.round(this.budgetPlan.income * this.livingCostShare) / 100;
    this.calculateSurplus();
  }

  private calculateSurplus(): void {
    if (!this.budgetPlan) {
      return;
    }

    const totalIncome = this.budgetPlan.income;
    const totalCategoryExpenses = this.budgetPlan.expenses.map(item => item.value).reduce((prev, next) => prev + next, 0);
    const totalExpenses = totalCategoryExpenses + this.livingCosts;
    const surplus = totalIncome - totalExpenses;
    
    this.monthlySurplus = Number(surplus.toFixed(1));
    
    if (totalIncome != 0) {
      const percent = 100 / totalIncome * totalExpenses
      this.monthlyExpensesPercent = Number(percent.toFixed(1));
      const surplus = 100 - percent;
      this.monthlySurplusPercent = Number(surplus.toFixed(1));
    } else {
      this.monthlyExpensesPercent = 0;
      this.monthlySurplusPercent = 0;
    }
  }

  private loadSettings(): void {
    this.settingsError = false;
    this.budgetPlanApiService.getBudgetPlanSettings().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: settings => {
        this.livingCostShare = settings.livingCostShare;
        this.recalculate();
      },
      error: () => this.settingsError = true
    });
  }

  private initSubscriptions(): void {
    this.budgetPlanContextService.budgetPlan().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: budgetPlan => {
          if (budgetPlan) {
            this.budgetPlan = budgetPlan;
            this.recalculate();
          }
        }
      }
    );
  }
}
