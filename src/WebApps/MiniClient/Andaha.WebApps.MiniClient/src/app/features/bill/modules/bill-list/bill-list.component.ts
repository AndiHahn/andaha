import { CdkScrollable, ScrollDispatcher } from '@angular/cdk/scrolling';
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { filter, takeUntil } from 'rxjs/operators';
import { PageEvent } from '@angular/material/paginator';
import { BillContextService } from '../../../../services/bill-context.service';
import { BillDataSource } from './BillDataSource';
import { Subject } from 'rxjs';
import { BillCategoryDto } from 'src/app/api/shopping/dtos/BillCategoryDto';
import { BillListDateFilter } from './bill-list-filter/BillListDateFilter';

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

  showFilterBar: boolean = true;
  initialSearchValue?: string;
  initialCategoryFilters?: string[];
  initialDateFilter?: BillListDateFilter;
  dateFilterEnabled: boolean = false;
  
  private destroy$: Subject<void> = new Subject();

  constructor(
    private scrollDispatcher: ScrollDispatcher,
    private billContextService: BillContextService) {
      const searchText = this.billContextService.getSearchText();
      if (searchText.length > 0) {
        this.initialSearchValue = searchText;
      }

      const categoryFilters = this.billContextService.getCategoryFilter();
      if (categoryFilters?.length > 0) {
        this.initialCategoryFilters = categoryFilters;
      }

      const fromDateFilter = this.billContextService.getFromDateFilter();
      const untilDateFilter = this.billContextService.getUntilDateFilter();
      if (fromDateFilter || untilDateFilter) {
        this.initialDateFilter = {
          fromDate: fromDateFilter,
          untilDate: untilDateFilter
        }
      }

      this.updateDateFilterEnabled();
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
    this.billContextService.setPageIndex(event.pageIndex);
    this.billContextService.setPageSize(event.pageSize);
  }

  onSearchInput(searchText: string): void {
    this.billContextService.searchBills(searchText, undefined);
  }

  onCategoryFilterChanged(selectedCategories: BillCategoryDto[]): void {
    const categoryFilter = selectedCategories.map(category => category.name);

    this.initialCategoryFilters = categoryFilter;
    this.billContextService.searchBills(undefined, categoryFilter);
  }

  onDateFilterChanged(dateFilter: BillListDateFilter): void {
    this.initialDateFilter = dateFilter;
    this.updateDateFilterEnabled();
    this.billContextService.searchWithDateFilter(dateFilter.fromDate, dateFilter.untilDate);
  }

  private previousTop: number = 0;

  private onScroll(data: any) {
    if (data instanceof CdkScrollable) {
      const topOffset = data.measureScrollOffset('top');
      const bottomOffset = data.measureScrollOffset('bottom');

      // hide filterbar on scroll down and show it on scroll up
      if (topOffset < this.previousTop || topOffset <= 0) {
        this.showFilterBar = true;
      } else {
        this.showFilterBar = false;
      }

      const thresholdReached = bottomOffset < (topOffset + bottomOffset) / 2;
      if (thresholdReached && !this.loading) {
        this.billContextService.fetchNextBills();
      }

      this.previousTop = topOffset;
    }
  }

  private updateDateFilterEnabled(): void {
    if (!this.initialDateFilter?.fromDate && !this.initialDateFilter?.untilDate) {
      this.dateFilterEnabled = false;
    } else {
      this.dateFilterEnabled = true;
    }
  }

  private initSubscriptions(): void {
    this.billContextService.bills().pipe(takeUntil(this.destroy$)).subscribe(
      {
        next: result => {
          this.billDataSource.update(result);
          this.totalCount = result.length;
        } 
      }
    );

    this.billContextService.totalResults().pipe(takeUntil(this.destroy$)).subscribe(
      {
        next: totalResults => this.totalResults = totalResults
      }
    );

    this.billContextService.pageSize().pipe(takeUntil(this.destroy$)).subscribe(
      {
        next: pageSize => this.pageSize = pageSize
      }
    );

    this.billContextService.loading().pipe(takeUntil(this.destroy$)).subscribe(
      {
        next: loading => this.loading = loading 
      }
    );
  }
}
