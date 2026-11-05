import { Injectable, OnDestroy, Signal, inject, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription, catchError, finalize, firstValueFrom, of, skip, timeout } from 'rxjs';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { BillDto } from 'src/app/api/shopping/dtos/BillDto';
import { ContextService } from 'src/app/core/context.service';
import { BillCreateDto, billCreateDtoToBillDto } from '../../../api/shopping/dtos/BillCreateDto';
import { BillUpdateDto } from '../../../api/shopping/dtos/BillUpdateDto';
import { BillCacheService } from './bill-cache.service';
import { BillCategoryDto } from '../../../api/shopping/dtos/BillCategoryDto';
import { BillSubCategoryDto } from '../../../api/shopping/dtos/BillSubCategoryDto';

// Ein haengender Request darf den Sync nicht dauerhaft blockieren; CreateBill ist idempotent
const SYNC_REQUEST_TIMEOUT_MS = 60000;
// Neue Zeile ist nach dem Speichern kurz hervorgehoben (v2: blendet nach ca. 2 s aus, CSS-Animation)
const LAST_ADDED_HIGHLIGHT_MS = 3000;

@Injectable({
  providedIn: 'root'
})
export class BillContextService implements OnDestroy {
  private billApiService = inject(BillApiService);
  private contextService = inject(ContextService);
  private billCacheService = inject(BillCacheService);

  private bills$: BehaviorSubject<BillDto[]> = new BehaviorSubject<BillDto[]>([]);
  private totalResults$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private monthSumsSubject = new BehaviorSubject<Map<string, number>>(new Map<string, number>());
  private pageIndex$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private pageSize$: BehaviorSubject<number> = new BehaviorSubject<number>(50);
  private loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private syncing$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private lastAddedId$ = new BehaviorSubject<string | null>(null);
  private lastAddedTimer?: ReturnType<typeof setTimeout>;

  private searchText: string = '';
  private categoryFilter?: string[];
  private fromDateFilter?: Date;
  private untilDateFilter?: Date;

  private queryGeneration: number = 0;
  private pendingRequests: Set<Subscription> = new Set<Subscription>();

  private syncRunning: boolean = false;
  private syncAgain: boolean = false;

  /** refreshBills(): die nächste Antwort ersetzt die Liste, statt sie zu ergänzen */
  private replaceListOnNextResult: boolean = false;
  private backendIsReady: boolean = false;
  private readonly errorState = signal(false);

  private readonly backendReadyState = signal(false);

  /** true, wenn das letzte Laden fehlgeschlagen ist (nachdem das Backend bereit war) oder das Backend nicht erreichbar ist */
  readonly error: Signal<boolean> = computed(() => this.errorState() || this.contextService.backendUnreachable());

  /** true, solange das Backend geweckt wird: die Liste lädt noch, sie ist nicht leer (AC34) */
  readonly waitingForBackend: Signal<boolean> = computed(() => !this.backendReadyState() && !this.contextService.backendUnreachable());

  /** Summe je Monat ("yyyy-MM") über alle Treffer der aktuellen Suche */
  readonly monthSums$: Observable<Map<string, number>> = this.monthSumsSubject.asObservable();

  private readonly onOnline = () => void this.syncNewBills();
  private readonly onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      this.syncNewBills();
    }
  };

  constructor() {
    this.initSubscriptions();
    window.addEventListener('online', this.onOnline);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.fetchBills();
  }

  ngOnDestroy(): void {
    clearTimeout(this.lastAddedTimer);
    window.removeEventListener('online', this.onOnline);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  bills(): Observable<BillDto[]> {
    return this.bills$.asObservable();
  }

  totalResults(): Observable<number> {
    return this.totalResults$.asObservable();
  }

  pageSize(): Observable<number> {
    return this.pageSize$.asObservable();
  }

  loading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  syncing(): Observable<boolean> {
    return this.syncing$.asObservable();
  }

  /** ID der zuletzt gespeicherten Rechnung, solange ihre Zeile hervorgehoben ist, sonst null */
  lastAddedId(): Observable<string | null> {
    return this.lastAddedId$.asObservable();
  }

  getSearchText(): string {
    return this.searchText;
  }

  getCategoryFilter(): string[] {
    return this.categoryFilter ?? [];
  }

  getFromDateFilter(): Date | undefined {
    return this.fromDateFilter;
  }

  getUntilDateFilter(): Date | undefined {
    return this.untilDateFilter;
  }

  setPageSize(size: number): void {
    if (size != this.pageSize$.value) {
      this.startNewQueryGeneration();
      this.pageSize$.next(size);
    }
  }

  setPageIndex(index: number): void {
    if (index != this.pageIndex$.value) {
      this.pageIndex$.next(index);
    }
  }

  searchBills(): void {
    this.startNewQueryGeneration();
    this.bills$.next([]);
    this.pageIndex$.next(0);
  }

  setSearchText(searchText: string): void {
    this.searchText = searchText;
  }

  setCategoryFilter(categoryFilter: string[]): void {
    this.categoryFilter = categoryFilter;
  }

  setDateFilter(fromDateFilter?: Date, untilDateFilter?: Date) {
    this.fromDateFilter = fromDateFilter;
    this.untilDateFilter = untilDateFilter;
  }

  fetchNextBills(): void {
    if ((this.pageIndex$.value + 1) * this.pageSize$.value >= this.totalResults$.value) {
      return;
    }

    this.setPageIndex(this.pageIndex$.value + 1);
  }

  /**
   * Lädt die aktuelle Suche ab der ersten Seite neu (Pull-to-Refresh, Änderungen an Kategorien oder
   * Verbindungen) und ersetzt die Liste mit der Antwort; bis dahin bleibt die bisherige Liste stehen.
   */
  refreshBills(): void {
    this.startNewQueryGeneration();
    this.replaceListOnNextResult = true;
    this.pageIndex$.next(0);
  }

  /** Liste erneut laden (bzw. Backend erneut wecken, solange es nicht bereit ist) */
  retry(): void {
    if (this.backendIsReady) {
      this.fetchBills();
    } else {
      this.contextService.retryWakeUp();
    }
  }

  async addBill(dto: BillCreateDto, category: BillCategoryDto, subCategory?: BillSubCategoryDto): Promise<void> {
    const billDto = billCreateDtoToBillDto(dto, category, subCategory);
    this.addNewBillToList(billDto);

    try {
      await this.billCacheService.saveNewBillLocal(dto);
    } catch (error) {
      this.bills$.next(this.bills$.value.filter(bill => bill.id != dto.id));
      this.totalResults$.next(this.totalResults$.value - 1);
      this.adjustSums(billDto.date, -billDto.price);
      throw error;
    }

    this.markLastAdded(dto.id);
  }

  /** Rechnung, die schon beim Server gespeichert ist (Übernehmen aus der Analyse): in die Liste und hervorheben */
  showAddedBill(dto: BillCreateDto, category: BillCategoryDto, subCategory?: BillSubCategoryDto): void {
    if (!this.bills$.value.some(bill => bill.id == dto.id)) {
      this.addNewBillToList(billCreateDtoToBillDto(dto, category, subCategory));
    }
    this.markLastAdded(dto.id);
  }

  updateBill(
    id: string,
    updateDto: BillUpdateDto,
    imageAvailable: boolean,
    category: BillCategoryDto,
    subCategory?: BillSubCategoryDto): Observable<void> {
    const returnSubject = new Subject<void>();

    const bill = this.bills$.value.find(bill => bill.id == id);
    const previous = bill ? {
      shopName: bill.shopName,
      notes: bill.notes,
      price: bill.price,
      date: bill.date,
      category: bill.category,
      subCategory: bill.subCategory,
      imageAvailable: bill.imageAvailable
    } : undefined;
    if (bill) {
      this.adjustSums(bill.date, -bill.price);
      this.adjustSums(updateDto.date, updateDto.price);
      bill.shopName = updateDto.shopName;
      bill.notes = updateDto.notes;
      bill.price = updateDto.price;
      bill.date = updateDto.date;
      bill.category = category;
      bill.subCategory = subCategory;
      bill.imageAvailable = updateDto.image != undefined || imageAvailable;
    }

    this.billApiService.updateBill(id, updateDto).subscribe(
      {
        next: _ => {
          returnSubject.next();
        } ,
        error: error => {
          if (bill && previous) {
            Object.assign(bill, previous);
          }
          this.fetchBills();
          returnSubject.error(error);
        } 
      }
    );

    return returnSubject.asObservable();
  }

  deleteBill(id: string): Observable<void> {
    const returnSubject = new Subject<void>();

    const deleted = this.bills$.value.find(bill => bill.id == id);
    const billsWithoutDeleted = this.bills$.value.filter(bill => bill.id != id);
    this.bills$.next(billsWithoutDeleted);
    this.totalResults$.next(this.totalResults$.value - 1);
    if (deleted) {
      this.adjustSums(deleted.date, -deleted.price);
    }

    this.billApiService.deleteBill(id).subscribe(
      {
        next: _ => {
          returnSubject.next();
        },
        error: error => {
          this.fetchBills();
          returnSubject.error(error);
        } 
      }
    );

    return returnSubject.asObservable();
  }

  getBillById(id: string): BillDto | undefined {
    return this.bills$.value.find(bill => bill.id == id);
  }

  loadBillById(id: string): Observable<BillDto | undefined> {
    const known = this.getBillById(id);
    if (known) {
      return of(known);
    }

    return this.billApiService.getBill(id).pipe(catchError(() => of(undefined)));
  }

  private initSubscriptions(): void {
    this.contextService.backendReady().subscribe(
      {
        next: ready => {
          this.backendIsReady = ready;
          this.backendReadyState.set(ready);
          if (ready) {
            this.fetchBills();
            this.syncNewBills();
          }
        } 
      }
    );

    this.pageIndex$.asObservable().pipe(skip(1)).subscribe(
      {
        next: _ => this.fetchBills() 
      }
    );

    this.pageSize$.asObservable().pipe(skip(1)).subscribe(
      {
        next: _ => this.fetchBills() 
      }
    );

    this.billCacheService.billAdded().subscribe(
      {
        next: _ => this.syncNewBills()
      }
    );
  }

  private startNewQueryGeneration(): void {
    this.queryGeneration++;
    const superseded = Array.from(this.pendingRequests);
    this.pendingRequests.clear();
    superseded.forEach(subscription => subscription.unsubscribe());
  }

  private fetchBills() {
    const generation = this.queryGeneration;
    const replaceList = this.replaceListOnNextResult;
    this.replaceListOnNextResult = false;
    this.loading$.next(true);
    this.errorState.set(false);

    const request = new Subscription();
    this.pendingRequests.add(request);

    request.add(this.billApiService
      .searchBills(
        {
          pageIndex: this.pageIndex$.value,
          pageSize: this.pageSize$.value,
          search: this.searchText,
          categoryFilter: this.categoryFilter,
          fromDateFilter: this.fromDateFilter,
          untilDateFilter: this.untilDateFilter
        })
      .pipe(
        finalize(() => {
          if (generation !== this.queryGeneration) {
            return;
          }

          this.pendingRequests.delete(request);
          if (this.pendingRequests.size === 0) {
            this.loading$.next(false);
          }
        })
      )
      .subscribe(
        {
          next: result => {
            if (generation !== this.queryGeneration) {
              return;
            }

            if (replaceList) {
              this.bills$.next([...result.values].sort(this.billCompareDateDescending));
            } else {
              this.updateBillList(result.values);
            }
            this.totalResults$.next(result.totalCount);
            this.monthSumsSubject.next(new Map((result.monthSums ?? []).map(monthSum => [monthSum.month, monthSum.sum])));
          },
          error: _ => {
            if (generation === this.queryGeneration && this.backendIsReady) {
              this.errorState.set(true);
            }
          }
        }
    ));
  }

  private updateBillList(newBills: BillDto[]) {
    let bills: BillDto[] = [];
    
    bills = this.bills$.value;

    newBills.forEach(bill => {
      const existingBill = bills.find(b => b.id == bill.id);
      if (existingBill) {
        existingBill.category.name = bill.category.name;
        existingBill.category.color = bill.category.color;
      } else {
        bills.push(bill);
      }
    });

    bills.sort(this.billCompareDateDescending);

    this.bills$.next(bills);
  }

  private markLastAdded(id: string): void {
    clearTimeout(this.lastAddedTimer);
    this.lastAddedId$.next(id);
    this.lastAddedTimer = setTimeout(() => this.lastAddedId$.next(null), LAST_ADDED_HIGHLIGHT_MS);
  }

  private addNewBillToList(bill: BillDto): void {
    const bills = [bill].concat(this.bills$.value);
    if (bills.length > this.pageSize$.value) {
      bills.pop();
    }

    bills.sort(this.billCompareDateDescending);

    this.bills$.next(bills);
    this.totalResults$.next(this.totalResults$.value + 1);
    this.adjustSums(bill.date, bill.price);
  }

  /** Monatssumme sofort mitführen, bis die nächste Server-Antwort sie ersetzt */
  private adjustSums(date: Date, amount: number): void {
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthSums = new Map(this.monthSumsSubject.value);
    const monthSum = (monthSums.get(month) ?? 0) + amount;
    if (Math.abs(monthSum) < 0.005) {
      monthSums.delete(month);
    } else {
      monthSums.set(month, monthSum);
    }
    this.monthSumsSubject.next(monthSums);
  }

  private async syncNewBills(): Promise<void> {
    if (this.syncRunning) {
      this.syncAgain = true;
      return;
    }

    this.syncRunning = true;
    let anySynced = false;
    try {
      const newBillsLocal = await this.billCacheService.getBillsToSync();
      if (newBillsLocal.length > 0) {
        this.syncing$.next(true);
        const results = await Promise.all(newBillsLocal.map(bill => this.syncBill(bill)));
        anySynced = results.some(synced => synced);
      }
    } catch (error) {
      console.error('Syncing bills failed', error);
    } finally {
      this.syncing$.next(false);
      this.syncRunning = false;
    }

    if (anySynced) {
      this.fetchBills();
    }

    if (this.syncAgain) {
      this.syncAgain = false;
      void this.syncNewBills();
    }
  }

  private async syncBill(dto: BillCreateDto): Promise<boolean> {
    try {
      await firstValueFrom(this.billApiService.addBill(dto).pipe(timeout(SYNC_REQUEST_TIMEOUT_MS)));
    } catch (error) {
      console.error('Syncing bill failed, keeping it locally', error);
      return false;
    }

    try {
      await this.billCacheService.removeBillLocal(dto.id);
    } catch (error) {
      console.error('Removing synced bill failed', error);
    }

    return true;
  }

  private billCompareDateDescending(left: BillDto, right: BillDto): number {
    return right.date.getTime() - left.date.getTime();
  }
}
