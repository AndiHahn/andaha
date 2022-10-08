import { Component, OnInit } from '@angular/core';
import { ExpenseDto } from 'src/app/api/shopping/dtos/ExpenseDto';
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

  constructor(
    private expenseContextService: ExpenseContextService) { }

  ngOnInit(): void {
    this.initSubscriptions();
  }

  timeSelectionChanged(timeRange: TimeRange): void {
    this.expenseContextService.loadExpenses(timeRange);
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
          }
        }
      }
    );
  }
}
