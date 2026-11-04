import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DurationLabel } from 'src/app/api/budgetplan/dtos/Duration';
import { IncomeDto } from 'src/app/api/budgetplan/dtos/IncomeDto';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

@Component({
    selector: 'app-income-list',
    templateUrl: './income-list.component.html',
    styleUrls: ['./income-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterLink, DecimalPipe]
})
export class IncomeListComponent implements OnInit {

  @Input()
  incomes!: IncomeDto[];

  durationLabel = DurationLabel;

  constructor() { }

  ngOnInit(): void {
    if (!this.incomes) {
      throw new Error('Incomes are required in order to use this component.');
    }
  }

}
