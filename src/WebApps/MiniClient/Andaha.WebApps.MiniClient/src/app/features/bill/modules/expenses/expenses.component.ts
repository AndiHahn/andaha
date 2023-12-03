import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { ExpenseDto } from 'src/app/api/shopping/dtos/ExpenseDto';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { ExpenseContextService } from 'src/app/features/bill/services/expense-context.service';
import { mapTimeRangeDto, TimeRange } from '../../../../shared/models/TimeRange';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent implements OnInit {

  availableTimeRange?: TimeRange;
  expenses: ExpenseDto[] = [];
  categories: CategoryDto[] = [];
  isLoading: boolean = false;

  sum: number = 0.0;

  selectedTimeRange?: TimeRange;

  constructor(
    private expenseContextService: ExpenseContextService,
    private categoryContextService: BillCategoryContextService) { }

  ngOnInit(): void {
    this.initSubscriptions();
  }

  timeSelectionChanged(timeRange: TimeRange): void {
    this.isLoading = true;
    this.selectedTimeRange = timeRange;
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
