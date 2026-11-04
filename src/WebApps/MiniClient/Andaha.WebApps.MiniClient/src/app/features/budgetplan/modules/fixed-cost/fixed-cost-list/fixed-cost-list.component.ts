import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CostCategory, CostCategoryLabel } from 'src/app/api/budgetplan/dtos/CostCategory';
import { DurationLabel } from 'src/app/api/budgetplan/dtos/Duration';
import { FixedCostDto } from 'src/app/api/budgetplan/dtos/FixedCostDto';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

@Component({
    selector: 'app-fixed-cost-list',
    templateUrl: './fixed-cost-list.component.html',
    styleUrls: ['./fixed-cost-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterLink, DecimalPipe]
})
export class FixedCostListComponent implements OnInit {

  @Input()
  category!: CostCategory;

  @Input()
  fixedCosts!: FixedCostDto[];

  costCategoryLabel = CostCategoryLabel;
  durationLabel = DurationLabel;

  constructor() { }

  ngOnInit(): void {
    if (!this.category) {
      throw new Error('Category is required in order to use this component.');
    }

    if (!this.fixedCosts) {
      throw new Error('FixedCosts are required in order to use this component.');
    }
  }

}
