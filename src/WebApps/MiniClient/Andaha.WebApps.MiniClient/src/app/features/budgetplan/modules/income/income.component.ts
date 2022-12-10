import { Component, OnInit } from '@angular/core';
import { IncomeDto } from 'src/app/api/budgetplan/dtos/IncomeDto';
import { IncomeContextService } from '../../services/income-context.service';

@Component({
  selector: 'app-income',
  templateUrl: './income.component.html',
  styleUrls: ['./income.component.scss']
})
export class IncomeComponent implements OnInit {

  incomes?: IncomeDto[];

  constructor(
    private incomeContextService: IncomeContextService
  ) {
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
