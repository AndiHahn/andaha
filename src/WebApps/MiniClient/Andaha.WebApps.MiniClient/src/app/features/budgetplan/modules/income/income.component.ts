import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IncomeDto } from 'src/app/api/budgetplan/dtos/IncomeDto';
import { IncomeContextService } from '../../services/income-context.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { IncomeListComponent } from './income-list/income-list.component';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatFabButton } from '@angular/material/button';

@Component({
    selector: 'app-income',
    templateUrl: './income.component.html',
    styleUrls: ['./income.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatProgressSpinner, IncomeListComponent, RouterLink, MatIcon, MatFabButton]
})
export class IncomeComponent implements OnInit {
  private incomeContextService = inject(IncomeContextService);
  private destroyRef = inject(DestroyRef);


  incomes?: IncomeDto[];

  constructor() {
    this.initSubscriptions();
  }

  ngOnInit(): void {
  }

  private initSubscriptions(): void {
    this.incomeContextService.incomes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
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
