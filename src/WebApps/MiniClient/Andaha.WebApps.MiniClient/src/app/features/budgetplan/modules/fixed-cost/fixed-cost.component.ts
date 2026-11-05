import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CostCategory } from 'src/app/api/budgetplan/dtos/CostCategory';
import { FixedCostDto } from 'src/app/api/budgetplan/dtos/FixedCostDto';
import { FixedCostContextService } from '../../services/fixed-cost-context.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { FixedCostListComponent } from './fixed-cost-list/fixed-cost-list.component';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatFabButton } from '@angular/material/button';

interface CostCategoryDictionary {
  [key: string]: FixedCostDto[];
}

@Component({
    selector: 'app-fixed-cost',
    templateUrl: './fixed-cost.component.html',
    styleUrls: ['./fixed-cost.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatProgressSpinner, FixedCostListComponent, RouterLink, MatIcon, MatFabButton]
})
export class FixedCostComponent implements OnInit {
  private fixedCostContextService = inject(FixedCostContextService);
  private destroyRef = inject(DestroyRef);


  fixedCosts?: CostCategoryDictionary;

  costCategoryOptions = Object.values(CostCategory);

  constructor() {
    this.initSubscriptions();
  }

  ngOnInit(): void {
  }

  private updateFixedCosts(fixedCosts: FixedCostDto[]) : void {
    const groupedCosts: CostCategoryDictionary = {};

    this.costCategoryOptions.forEach(category => {
      groupedCosts[category] = fixedCosts.filter(cost => cost.category == category);
    });
  
    this.fixedCosts = groupedCosts;
  }

  private initSubscriptions(): void {
    this.fixedCostContextService.fixedCosts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: fixedCosts => {
          if (fixedCosts) {
            this.updateFixedCosts(fixedCosts);
          }
        }
      }
    );
  }
}
