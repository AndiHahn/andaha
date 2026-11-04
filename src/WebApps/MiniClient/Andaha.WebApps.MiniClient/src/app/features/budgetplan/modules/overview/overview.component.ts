import { Component, OnInit } from '@angular/core';
import { BudgetPlanDto } from 'src/app/api/budgetplan/dtos/BudgetPlanDto';
import { CostCategoryLabel } from 'src/app/api/budgetplan/dtos/CostCategory';
import { BudgetplanContextService } from '../../services/budgetplan-context.service';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
  standalone: false
})
export class OverviewComponent implements OnInit {

  budgetPlan?: BudgetPlanDto;

  livingCosts: number = 0;

  monthlySurplus: number = 0;
  monthlyExpensesPercent: number = 0;
  monthlySurplusPercent: number = 0;

  costCategoryLabel = CostCategoryLabel;
  
  constructor(
    private budgetPlanContextService: BudgetplanContextService
  ) { }

  ngOnInit(): void {
    this.initSubscriptions();
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

  private initSubscriptions(): void {
    this.budgetPlanContextService.budgetPlan().subscribe(
      {
        next: budgetPlan => {
          if (budgetPlan) {
            this.budgetPlan = budgetPlan;
            this.livingCosts = Number((budgetPlan.income * 0.35).toFixed());
            this.calculateSurplus();
          }
        }
      }
    );
  }
}
