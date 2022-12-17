import { CdkScrollable, ScrollDispatcher } from '@angular/cdk/scrolling';
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { filter, takeUntil } from 'rxjs/operators';
import { PageEvent } from '@angular/material/paginator';
import { BillContextService } from '../../../../services/bill-context.service';
import { BillDataSource } from './BillDataSource';
import { Subject } from 'rxjs';
import { BillCategoryDto } from 'src/app/api/shopping/dtos/BillCategoryDto';

@Component({
  selector: 'app-bill-list',
  templateUrl: './bill-list.component.html',
  styleUrls: ['./bill-list.component.scss']
})
export class BillListComponent implements OnInit, AfterViewInit, OnDestroy {

  billDataSource = new BillDataSource();
  pixelHeightPerItem = 66;

  totalCount?: number;
  loading: boolean = false;

  pageSize?: number;
  totalResults?: number;

  timeoutHandler?: any;

  showFilterBar: boolean = false;
  initialSearchValue?: string;
  initialCategoryFilters?: string[];

  private destroy$: Subject<void> = new Subject();

  constructor(
    private scrollDispatcher: ScrollDispatcher,
    private billListContextService: BillContextService) {
      const searchText = this.billListContextService.getSearchText();
      if (searchText.length > 0) {
        this.initialSearchValue = searchText;
      }

      const categoryFilters = this.billListContextService.getCategoryFilter();
      if (categoryFilters?.length > 0) {
        this.initialCategoryFilters = categoryFilters;
      }
    }
  
  ngOnInit(): void {
    this.initSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }

  ngAfterViewInit(): void {
    this.scrollDispatcher
      .scrolled()
      .pipe(filter(data => data instanceof CdkScrollable))
      .subscribe(data => {
        this.onScroll(data);
      });
  }

  onPageChange(event: PageEvent): void {
    this.billListContextService.setPageIndex(event.pageIndex);
    this.billListContextService.setPageSize(event.pageSize);
  }

  onSearchInput(searchText: string): void {
    this.billListContextService.searchBills(searchText, undefined);
  }

  onCategoryFilterChanged(selectedCategories: BillCategoryDto[]) {
    const categoryFilter = selectedCategories.map(category => category.name);

    this.billListContextService.searchBills(undefined, categoryFilter);
  }

  private onScroll(data: any) {
    if (data instanceof CdkScrollable) {
      const topOffset = data.measureScrollOffset('top');
      const bottomOffset = data.measureScrollOffset('bottom');

      const thresholdReached = bottomOffset < (topOffset + bottomOffset) / 2;
      if (thresholdReached && !this.loading) {
        this.billListContextService.fetchNextBills();
      }
    }
  }

  private initSubscriptions(): void {
    this.billListContextService.bills().pipe(takeUntil(this.destroy$)).subscribe(
      {
        next: result => {
          this.billDataSource.update(result);
          this.totalCount = result.length;
        } 
      }
    );

    this.billListContextService.totalResults().pipe(takeUntil(this.destroy$)).subscribe(
      {
        next: totalResults => this.totalResults = totalResults
      }
    );

    this.billListContextService.pageSize().pipe(takeUntil(this.destroy$)).subscribe(
      {
        next: pageSize => this.pageSize = pageSize
      }
    );

    this.billListContextService.loading().pipe(takeUntil(this.destroy$)).subscribe(
      {
        next: loading => this.loading = loading 
      }
    );
  }
}
