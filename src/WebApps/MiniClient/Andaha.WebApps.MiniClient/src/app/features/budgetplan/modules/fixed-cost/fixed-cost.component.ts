import { Component, OnInit } from '@angular/core';
import { CostCategory } from 'src/app/api/budgetplan/dtos/CostCategory';
import { FixedCostDto } from 'src/app/api/budgetplan/dtos/FixedCostDto';
import { FixedCostContextService } from '../../services/fixed-cost-context.service';

interface CostCategoryDictionary {
  [key: string]: FixedCostDto[];
}

@Component({
  selector: 'app-fixed-cost',
  templateUrl: './fixed-cost.component.html',
  styleUrls: ['./fixed-cost.component.scss']
})
export class FixedCostComponent implements OnInit {

  fixedCosts?: CostCategoryDictionary;

  costCategoryOptions = Object.values(CostCategory);

  constructor(
    private fixedCostContextService: FixedCostContextService
  ) {
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
    this.fixedCostContextService.fixedCosts().subscribe(
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
