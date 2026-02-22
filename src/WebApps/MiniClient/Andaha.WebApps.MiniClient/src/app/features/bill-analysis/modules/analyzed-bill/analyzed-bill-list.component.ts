import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { PageEvent } from '@angular/material/paginator';
import { AnalyzedBillContextService } from '../../services/analyzed-bill-context.service';
import { CdkScrollable, ScrollDispatcher } from '@angular/cdk/scrolling';
import { AnalyzedBillDataSource } from './AnalyzedBillDataSource';

@Component({
  selector: 'app-analyzed-bill-list',
  templateUrl: './analyzed-bill-list.component.html',
  styleUrls: ['./analyzed-bill-list.component.scss']
})
export class AnalyzedBillListComponent implements OnInit, AfterViewInit, OnDestroy {
  billDataSource = new AnalyzedBillDataSource();
  pixelHeightPerItem = 66;

  totalCount?: number;
  loading: boolean = false;

  pageSize?: number;
  totalResults?: number;

  showFilterBar: boolean = true;
  timeoutHandler?: any;

  private destroy$: Subject<void> = new Subject();

  constructor(
    private scrollDispatcher: ScrollDispatcher,
    private analyzedBillContextService: AnalyzedBillContextService) {
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
        .pipe(takeUntil(this.destroy$))
        .pipe(filter(data => data instanceof CdkScrollable))
        .subscribe(data => {
          this.onScroll(data);
        });
    }

  onPageChange(event: PageEvent): void {
    this.analyzedBillContextService.setPageIndex(event.pageIndex);
    this.analyzedBillContextService.setPageSize(event.pageSize);
  }

  onSearchInput(searchText: string): void {
    this.analyzedBillContextService.setSearchText(searchText);
    this.analyzedBillContextService.setPageIndex(0);
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
        this.analyzedBillContextService.fetchNextBills();
      }

      this.previousTop = topOffset;
    }
  }

  private initSubscriptions(): void {
    this.analyzedBillContextService.bills().pipe(takeUntil(this.destroy$)).subscribe(
      {
        next: result => {
          this.billDataSource.update(result);
          this.totalCount = result.length;
        } 
      }
    );

    this.analyzedBillContextService.totalResults().pipe(takeUntil(this.destroy$)).subscribe(
      {
        next: totalResults => this.totalResults = totalResults
      }
    );

    this.analyzedBillContextService.pageSize().pipe(takeUntil(this.destroy$)).subscribe(
      {
        next: pageSize => this.pageSize = pageSize
      }
    );

    this.analyzedBillContextService.loading().pipe(takeUntil(this.destroy$)).subscribe(
      {
        next: loading => this.loading = loading 
      }
    );
  }
}
