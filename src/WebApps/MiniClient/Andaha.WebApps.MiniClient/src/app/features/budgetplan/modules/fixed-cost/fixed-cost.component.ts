import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CostCategory, CostCategoryLabel } from 'src/app/api/budgetplan/dtos/CostCategory';
import { LoadState, LoadStateComponent } from 'src/app/shared/load-state/load-state.component';
import { FixedCostDto } from 'src/app/api/budgetplan/dtos/FixedCostDto';
import { FixedCostContextService } from '../../services/fixed-cost-context.service';
import { FixedCostListComponent } from './fixed-cost-list/fixed-cost-list.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
    imports: [LoadStateComponent, FixedCostListComponent, RouterLink, MatIcon, MatFabButton]
})
export class FixedCostComponent implements OnInit {
  private fixedCostContextService = inject(FixedCostContextService);
  private destroyRef = inject(DestroyRef);


  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly contextError = this.fixedCostContextService.error;

  fixedCosts?: CostCategoryDictionary;
  hasFixedCosts = false;

  costCategoryOptions = Object.values(CostCategory);
  costCategoryLabel = CostCategoryLabel;

  /** Kategorie aus dem Query-Parameter `category` (Tipp auf eine Kategorie der Übersicht, AC9) */
  filterCategory?: CostCategory;

  constructor() {
    this.initSubscriptions();
  }

  ngOnInit(): void {
  }

  get visibleCategories(): CostCategory[] {
    return this.filterCategory ? [this.filterCategory] : this.costCategoryOptions;
  }

  get loadState(): LoadState {
    if (this.contextError()) {
      return 'error';
    }
    if (!this.fixedCosts) {
      return 'loading';
    }

    return !this.filterCategory && !this.hasFixedCosts ? 'empty' : 'ready';
  }

  retry(): void {
    this.fixedCostContextService.retry();
  }

  clearFilter(): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { category: null }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  private updateFixedCosts(fixedCosts: FixedCostDto[]) : void {
    const groupedCosts: CostCategoryDictionary = {};

    this.costCategoryOptions.forEach(category => {
      groupedCosts[category] = fixedCosts.filter(cost => cost.category == category);
    });
  
    this.fixedCosts = groupedCosts;
    this.hasFixedCosts = fixedCosts.length > 0;
  }

  private initSubscriptions(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const category = params.get('category');
      this.filterCategory = this.costCategoryOptions.find(option => option === category);
    });

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
