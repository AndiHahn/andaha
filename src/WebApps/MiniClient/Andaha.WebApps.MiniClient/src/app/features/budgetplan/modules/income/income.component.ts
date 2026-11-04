import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { IncomeDto } from 'src/app/api/budgetplan/dtos/IncomeDto';
import { IncomeContextService } from '../../services/income-context.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { IncomeListComponent } from './income-list/income-list.component';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-income',
    templateUrl: './income.component.html',
    styleUrls: ['./income.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatProgressSpinner, IncomeListComponent, RouterLink, MatIcon]
})
export class IncomeComponent implements OnInit {
  private incomeContextService = inject(IncomeContextService);


  incomes?: IncomeDto[];

  constructor() {
    this.initSubscriptions();
  }

  ngOnInit(): void {
  }

  private initSubscriptions(): void {
    this.incomeContextService.incomes().subscribe(
      {
        next: incomes => {
          if (incomes) {
            this.incomes = incomes;
          }
        }
      }
    );
  }
}
