import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DurationLabel } from 'src/app/api/budgetplan/dtos/Duration';
import { IncomeDto } from 'src/app/api/budgetplan/dtos/IncomeDto';

@Component({
  selector: 'app-income-list',
  templateUrl: './income-list.component.html',
  styleUrls: ['./income-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
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
