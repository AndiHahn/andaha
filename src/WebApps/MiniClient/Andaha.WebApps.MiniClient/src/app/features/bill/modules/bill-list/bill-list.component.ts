import { BreakpointObserver } from '@angular/cdk/layout';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ChangeDetectionStrategy, NgZone, ViewChild, inject, signal, viewChild } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { PageEvent, MatPaginator } from '@angular/material/paginator';
import { BillContextService } from '../../services/bill-context.service';
import { Subject, combineLatest } from 'rxjs';
import { BillDto } from 'src/app/api/shopping/dtos/BillDto';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { BillListDateFilter } from './bill-list-filter/BillListDateFilter';
import { BillListFilterComponent } from './bill-list-filter/bill-list-filter.component';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BillListItemComponent } from './bill-list-item/bill-list-item.component';
import { QuickEntryDockComponent } from '../../quick-entry/quick-entry-dock/quick-entry-dock.component';
import { QuickEntryService } from '../../quick-entry/quick-entry.service';
import { ScanService } from '../../scan/scan.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { SHARED_IMAGE_FAILED, readLaunchIntent, takeSharedImage } from '../../scan/shared-image';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { LoadState, LoadStateComponent } from 'src/app/shared/load-state/load-state.component';
import { groupByMonth, monthStart } from 'src/app/shared/utils/month-groups';
import { vibrate } from 'src/app/shared/utils/haptics';
import { duplicatePrefill } from '../../functions/duplicate-prefill';
import { PullToRefreshDirective } from './pull-to-refresh.directive';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MenuBackDirective } from 'src/app/core/overlay/menu-back.directive';
import { LongPressDirective } from 'src/app/shared/directives/long-press.directive';

/** Monatskopf mit der Monatssumme des Backends über alle Treffer (design.md §3.1, AC1) */
interface BillMonthGroup {
  month: string;
  start: Date;
  sum: number;
  bills: BillDto[];
}

@Component({
    selector: 'app-bill-list',
    templateUrl: './bill-list.component.html',
    styleUrls: ['./bill-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [BillListFilterComponent, MatProgressBar, MatIcon, CdkScrollable, RouterLink, BillListItemComponent, MatPaginator, QuickEntryDockComponent, LoadStateComponent, PullToRefreshDirective, LongPressDirective, MatMenu, MatMenuItem, MatMenuTrigger, MenuBackDirective, DatePipe, DecimalPipe]
})
export class BillListComponent implements OnInit, AfterViewInit, OnDestroy {
  private billContextService = inject(BillContextService);
  private breakpointObserver = inject(BreakpointObserver);
  private quickEntry = inject(QuickEntryService);
  private scanService = inject(ScanService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);
  private confirmationDialog = inject(ConfirmationDialogService);
  private zone = inject(NgZone);
  private host: HTMLElement = inject(ElementRef).nativeElement;

  @ViewChild(CdkScrollable) private scrollable?: CdkScrollable;
  private readonly menuTrigger = viewChild.required<MatMenuTrigger>('menuTrigger');

  /** Rechnung, deren Kontextmenü (langer Druck, AC3) offen ist, und die Lage des Menüs */
  readonly menuBill = signal<BillDto | null>(null);
  readonly menuTop = signal(0);
  readonly menuLeft = signal(0);

  /** Fehlerzustand der Liste (nach dem Wecken des Backends) */
  readonly loadFailed = this.billContextService.error;

  bills: BillDto[] = [];
  monthGroups: BillMonthGroup[] = [];
  isDesktop = false;
  /** gerade gespeicherte Rechnung, deren Zeile kurz hervorgehoben ist (v2) */
  lastAddedId: string | null = null;

  loading: boolean = false;

  pageSize?: number;
  totalResults: number = 0;

  showFilterBar: boolean = true;
  initialSearchValue?: string;
  initialCategoryFilters?: string[];
  initialDateFilter?: BillListDateFilter;
  
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
    }

  /** Laden, Fehler und Leerzustand (AC34); geladene Zeilen bleiben bei Fehlern späterer Seiten stehen */
  get loadState(): LoadState {
    if (this.bills.length > 0) {
      return 'ready';
    }
    if (this.loadFailed()) {
      return 'error';
    }
    // solange das Backend noch geweckt wird, ist die Liste nicht leer, sondern lädt noch
    return this.loading || this.billContextService.waitingForBackend() ? 'loading' : 'empty';
  }

  get emptyText(): string {
    const context = this.billContextService;
    const filtered = context.getSearchText().length > 0 || context.getCategoryFilter().length > 0
      || !!context.getFromDateFilter() || !!context.getUntilDateFilter();
    return filtered
      ? 'Keine Rechnungen gefunden – entferne einen Filter oder ändere die Suche.'
      : 'Noch keine Rechnungen – neue Rechnungen erscheinen hier.';
  }
  
  ngOnInit(): void {
    this.initSubscriptions();
    this.initDesktop();
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
    // Scroll-Events kommen außerhalb der Zone; die Zone nur betreten, wenn sich etwas ändert
    this.scrollable?.elementScrolled()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onScroll());
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
    this.billContextService.setDateFilter(dateFilter.fromDate, dateFilter.untilDate);
    this.billContextService.searchBills();
  }

  onPullRefresh(): void {
    this.billContextService.refreshBills();
  }

  onRetry(): void {
    this.billContextService.retry();
  }

  /** Langer Druck bzw. Rechtsklick auf eine Zeile: Menü unter der Zeile öffnen (AC3) */
  onRowPress(bill: BillDto, row: HTMLElement): void {
    const hostRect = this.host.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    this.menuTop.set(rowRect.bottom - hostRect.top);
    this.menuLeft.set(rowRect.left - hostRect.left + 16);
    this.menuBill.set(bill);
    this.menuTrigger().openMenu();
  }

  duplicate(bill: BillDto): void {
    void this.router.navigate(['/bill/create'], { state: { prefill: duplicatePrefill(bill, new Date()) } });
  }

  /** Rückfrage, dann löschen; Rechnungen verbundener Konten bietet das Menü nicht zum Löschen an */
  async confirmDelete(bill: BillDto): Promise<void> {
    const dialogRef = await this.confirmationDialog.openDialog({
      text: 'Soll die Rechnung und alle damit verbundenen Daten wirklich gelöscht werden?'
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) {
        return;
      }

      this.billContextService.deleteBill(bill.id).subscribe({
        next: () => vibrate(),
        error: () => openErrorSnackbar('Rechnung konnte nicht gelöscht werden.', this.snackbar)
      });
    });
  }

  private previousTop: number = 0;

  private onScroll(): void {
    const scrollable = this.scrollable;
    if (!scrollable) {
      return;
    }

    const topOffset = scrollable.measureScrollOffset('top');
    const bottomOffset = scrollable.measureScrollOffset('bottom');

    // hide filterbar on scroll down and show it on scroll up
    const showFilterBar = topOffset < this.previousTop || topOffset <= 0;
    const thresholdReached = bottomOffset < (topOffset + bottomOffset) / 2;
    const fetchNext = thresholdReached && !this.loading && this.bills.length < this.totalResults;
    this.previousTop = topOffset;

    if (showFilterBar !== this.showFilterBar || fetchNext) {
      this.zone.run(() => {
        this.showFilterBar = showFilterBar;
        if (fetchNext) {
          this.billContextService.fetchNextBills();
        }
      });
    }
  }

  private initDesktop(): void {
    this.breakpointObserver.observe('(min-width: 1024px)').pipe(takeUntil(this.destroy$)).subscribe(
      {
        next: state => this.isDesktop = state.matches
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

    combineLatest([this.billContextService.bills(), this.billContextService.monthSums$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([bills, monthSums]) => {
        this.bills = bills;
        this.monthGroups = groupByMonth(bills, bill => bill.date).map(group => ({
          month: group.month,
          start: monthStart(group.month),
          sum: monthSums.get(group.month) ?? 0,
          bills: group.items
        }));
      });

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
