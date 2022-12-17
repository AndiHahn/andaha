import { Component, OnInit } from '@angular/core';
import { BillCategoryDto } from 'src/app/api/shopping/dtos/BillCategoryDto';
import { ExpenseDto } from 'src/app/api/shopping/dtos/ExpenseDto';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { BillContextService } from 'src/app/services/bill-context.service';
import { ExpenseContextService } from 'src/app/services/expense-context.service';
import { mapTimeRangeDto, TimeRange } from './timerange-selection/TimeRange';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent implements OnInit {

  availableTimeRange?: TimeRange;
  expenses: ExpenseDto[] = [];
  categories: BillCategoryDto[] = [];
  isLoading: boolean = false;

  sum: number = 0.0;

  constructor(
    private expenseContextService: ExpenseContextService,
    private categoryContextService: BillCategoryContextService) { }

  ngOnInit(): void {
    this.initSubscriptions();
  }

  timeSelectionChanged(timeRange: TimeRange): void {
    this.isLoading = true;
    this.expenseContextService.loadExpenses(timeRange);
  }

  truncate(decimals: number, value?: number): number {
    if (value) {
      return Number(value.toFixed(decimals));
    }

    return 0.0;
  }

  private calculateSum(expenses: ExpenseDto[]) {
    let sum = 0.0;
    expenses.forEach(e => {
      sum += e.costs
    });

    this.sum = Number(sum.toFixed(2));
  }

  private initSubscriptions(): void {
    this.expenseContextService.availableTimeRange().subscribe(
      {
        next: timeRange => {
          if (timeRange) {
            this.availableTimeRange = mapTimeRangeDto(timeRange);
          }
        } 
      }
    );

    this.expenseContextService.expenses().subscribe(
      {
        next: expenses => {
          if (expenses) {
            this.expenses = expenses;
            this.calculateSum(expenses);
            this.isLoading = false;
          }
        }
      }
    );

    this.categoryContextService.categories().subscribe(
      {
        next: categories => {
          this.categories = categories;
        }
      }
    );
  }
}
