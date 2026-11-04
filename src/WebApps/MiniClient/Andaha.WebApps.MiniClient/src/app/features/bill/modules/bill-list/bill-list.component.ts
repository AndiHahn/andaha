import { BreakpointObserver } from '@angular/cdk/layout';
import { CdkScrollable, ScrollDispatcher, CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf } from '@angular/cdk/scrolling';
import { AfterViewInit, Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { filter, takeUntil } from 'rxjs/operators';
import { PageEvent, MatPaginator } from '@angular/material/paginator';
import { BillContextService } from '../../services/bill-context.service';
import { BillDataSource } from './BillDataSource';
import { Subject } from 'rxjs';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { BillListDateFilter } from './bill-list-filter/BillListDateFilter';
import { BillListFilterComponent } from './bill-list-filter/bill-list-filter.component';
import { MatProgressBar } from '@angular/material/progress-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BillListItemComponent } from './bill-list-item/bill-list-item.component';
import { QuickEntryDockComponent } from '../../quick-entry/quick-entry-dock/quick-entry-dock.component';
import { QuickEntryService } from '../../quick-entry/quick-entry.service';
import { ScanService } from '../../scan/scan.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { SHARED_IMAGE_FAILED, readLaunchIntent, takeSharedImage } from '../../scan/shared-image';

@Component({
    selector: 'app-bill-list',
    templateUrl: './bill-list.component.html',
    styleUrls: ['./bill-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [BillListFilterComponent, MatProgressBar, CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf, RouterLink, BillListItemComponent, MatPaginator, QuickEntryDockComponent]
})
export class BillListComponent implements OnInit, AfterViewInit, OnDestroy {
  private scrollDispatcher = inject(ScrollDispatcher);
  private billContextService = inject(BillContextService);
  private breakpointObserver = inject(BreakpointObserver);
  private quickEntry = inject(QuickEntryService);
  private scanService = inject(ScanService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);

  billDataSource = new BillDataSource();
  pixelHeightPerItem = 64;
  isDesktop = false;
  /** gerade gespeicherte Rechnung, deren Zeile kurz hervorgehoben ist (v2) */
  lastAddedId: string | null = null;

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

  constructor() {
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
    this.initItemSize();
    this.handleLaunchIntent();
  }

  openQuickEntry(): void {
    this.quickEntry.open();
  }

  // Kamera-Knopf (mobil) bzw. „Scannen“ (Desktop): Scan-Ablauf mit dem gewählten Foto (AC30)
  onScan(photo: File): void {
    void this.scanService.start(photo);
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
    this.billContextService.setPageIndex(event.pageIndex);
    this.billContextService.setPageSize(event.pageSize);
  }

  onSearchInput(searchText: string): void {
    this.billContextService.setSearchText(searchText);
    this.billContextService.searchBills();
  }

  onCategoryFilterChanged(selectedCategories: CategoryDto[]): void {
    const categoryFilter = selectedCategories.map(category => category.name);

    this.initialCategoryFilters = categoryFilter;
    this.billContextService.setCategoryFilter(categoryFilter);
    this.billContextService.searchBills();
  }

  onDateFilterChanged(dateFilter: BillListDateFilter): void {
    this.initialDateFilter = dateFilter;
    this.updateDateFilterEnabled();
    this.billContextService.setDateFilter(dateFilter.fromDate, dateFilter.untilDate);
    this.billContextService.searchBills();
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

  // Zeilenhoehe je Breakpoint: Mobile 64 px (Listenzeile), Desktop 52 px (Tabellenzeile, Mockup 07)
  private initItemSize(): void {
    this.breakpointObserver.observe('(min-width: 1024px)').pipe(takeUntil(this.destroy$)).subscribe(
      {
        next: state => {
          this.isDesktop = state.matches;
          this.pixelHeightPerItem = state.matches ? 52 : 64;
        }
      }
    );
  }

  // App-Shortcut „Rechnung eintragen“ (/bill/list?quick=1) und Share Target (/bill/list?shared=1 bzw. =0):
  // Parameter erst entfernen (replaceUrl), dann handeln, sonst ersetzt die Navigation den History-Eintrag
  // des Sheets (OverlayBackService) bzw. die Scan-Navigation. Ein geteiltes Bild wird auch ohne
  // Parameter abgeholt (z. B. wenn der Login-Redirect ?shared=1 verloren hat); der Cache-Eintrag
  // überlebt den Redirect und wird beim ersten Öffnen der Liste genau einmal verarbeitet.
  private handleLaunchIntent(): void {
    const { quick, shared } = readLaunchIntent(this.route.snapshot.queryParamMap);
    const clear = quick || shared
      ? this.router.navigate([], { relativeTo: this.route, queryParams: { quick: null, shared: null }, queryParamsHandling: 'merge', replaceUrl: true })
      : Promise.resolve(true);

    void clear.finally(async () => {
      if (quick) {
        this.quickEntry.open();
      }
      // geteilt, aber ohne brauchbares Bild (custom-sw.js): melden statt still verwerfen (AC38)
      if (shared === 'failed') {
        openErrorSnackbar(SHARED_IMAGE_FAILED, this.snackbar);
      }
      const image = await takeSharedImage();
      if (image) {
        await this.scanService.start(image);
      }
    });
  }

  private initSubscriptions(): void {
    this.billContextService.lastAddedId().pipe(takeUntil(this.destroy$)).subscribe(
      {
        next: id => this.lastAddedId = id
      }
    );

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
