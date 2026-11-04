import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnalyzedBillContextService } from '../../services/analyzed-bill-context.service';
import { CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf } from '@angular/cdk/scrolling';
import { AnalyzedBillDataSource } from './AnalyzedBillDataSource';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { MatProgressBar } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { AnalyzedBillListItemComponent } from './analyzed-bill-list-item/analyzed-bill-list-item.component';

/** Analyse-Tab: alle offenen Analysen, ohne Paginator (AC36, design.md §5.2); Virtual Scroll bleibt */
@Component({
    selector: 'app-analyzed-bill-list',
    templateUrl: './analyzed-bill-list.component.html',
    styleUrls: ['./analyzed-bill-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatProgressBar, CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf, RouterLink, AnalyzedBillListItemComponent]
})
export class AnalyzedBillListComponent implements OnInit, OnDestroy {
  private analyzedBillContextService = inject(AnalyzedBillContextService);
  private categoryContext = inject(BillCategoryContextService);

  billDataSource = new AnalyzedBillDataSource();
  pixelHeightPerItem = 64;
  categories: CategoryDto[] = [];

  totalCount?: number;
  loading: boolean = false;

  private destroy$: Subject<void> = new Subject();

  ngOnInit(): void {
    this.initSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }

  private initSubscriptions(): void {
    this.categoryContext.categories().pipe(takeUntil(this.destroy$)).subscribe(categories => this.categories = categories);

    this.analyzedBillContextService.bills().pipe(takeUntil(this.destroy$)).subscribe(
      {
        next: result => {
          this.billDataSource.update(result);
          this.totalCount = result.length;
        }
      }
    );

    this.analyzedBillContextService.loading().pipe(takeUntil(this.destroy$)).subscribe(
      {
        next: loading => this.loading = loading
      }
    );
  }
}
