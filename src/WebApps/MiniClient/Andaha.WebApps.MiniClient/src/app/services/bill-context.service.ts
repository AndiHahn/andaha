import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, skip, observable } from 'rxjs';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { BillDto } from 'src/app/api/shopping/dtos/BillDto';
import { ContextService } from 'src/app/core/context.service';
import { BillCategoryDto } from '../api/shopping/dtos/BillCategoryDto';
import { BillCreateDto, billCreateDtoToBillDto } from '../api/shopping/dtos/BillCreateDto';
import { BillCacheService } from './bill-cache.service';

@Injectable({
  providedIn: 'root'
})
export class BillContextService {
  private bills$: BehaviorSubject<BillDto[]> = new BehaviorSubject<BillDto[]>([]);
  private totalResults$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private pageIndex$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private pageSize$: BehaviorSubject<number> = new BehaviorSubject<number>(20);
  private loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private syncing$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private searchText: string = '';

  constructor(
    private billApiService: BillApiService,
    private contextService: ContextService,
    private billCacheService: BillCacheService
  ) {
    this.initSubscriptions();
    this.fetchBills();
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

  setPageSize(size: number): void {
    if (size != this.pageSize$.value) {
      this.pageSize$.next(size);
    }
  }

  setPageIndex(index: number): void {
    if (index != this.pageIndex$.value) {
      this.pageIndex$.next(index);
    }
  }

  searchBills(searchText: string): void {
    this.searchText = searchText;
    this.bills$.next([]);

    this.pageIndex$.next(0);
  }

  fetchNextBills(): void {
    if ((this.pageIndex$.value + 1) * this.pageSize$.value >= this.totalResults$.value) {
      return;
    }

    this.setPageIndex(this.pageIndex$.value + 1);
  }

  refreshBills(): void {
    this.fetchBills();
  }

  addBill(dto: BillCreateDto, category: BillCategoryDto): void {
    const returnSubject = new Subject<void>();

    const billDto = billCreateDtoToBillDto(dto, category);
    this.addNewBillToList(billDto);

    this.billCacheService.saveNewBillLocal(dto);

    this.syncBills();

    returnSubject.next();
  }

  deleteBill(id: string): Observable<void> {
    const returnSubject = new Subject<void>();

    this.billApiService.deleteBill(id).subscribe(
      {
        next: _ => {
          const bills = this.bills$.value.filter(bill => bill.id != id);

          this.bills$.next(bills);
          this.totalResults$.next(this.totalResults$.value - 1);
          
          returnSubject.next();
        },
        error: error => returnSubject.error(error)
      }
    );

    return returnSubject.asObservable();
  }

  private initSubscriptions(): void {
    this.contextService.backendReady().subscribe(
      {
        next: ready => {
          if (ready) {
            this.fetchBills();
            this.syncBills();
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
  }

  addBillInternal(dto: BillCreateDto): Observable<void> {
    const returnSubject = new Subject<void>();

    this.billApiService.addBill(dto).subscribe(
      {
        next: result => {
          this.billCacheService.removeBillLocal(result.id);
          returnSubject.next();
        },
        error: error => returnSubject.error(error)
      }
    );

    return returnSubject.asObservable();
  }

  private fetchBills() {
    this.loading$.next(true);

    this.billApiService
      .searchBills(
        {
          pageIndex: this.pageIndex$.value,
          pageSize: this.pageSize$.value,
          search: this.searchText
        })
      .subscribe(
        {
          next: result => {
            this.loading$.next(false);
            this.updateBillList(result.values);
            this.totalResults$.next(result.totalCount);
          },
          error: _ => this.loading$.next(false)
        }
    );
  }

  private updateBillList(newBills: BillDto[]) {
    const currentBillList = this.bills$.value;

    newBills.forEach(bill => {
      const existingBill = currentBillList.find(b => b.id == bill.id);
      if (existingBill) {
        existingBill.category.name = bill.category.name;
        existingBill.category.color = bill.category.color;
      } else {
        currentBillList.push(bill);
      }
    });

    currentBillList.sort(this.billCompareDateDescending);

    this.bills$.next(currentBillList);
  }

  private addNewBillToList(bill: BillDto): void {
    const bills = [bill].concat(this.bills$.value);
    if (bills.length > this.pageSize$.value) {
      bills.pop();
    }

    this.bills$.next(bills);
    this.totalResults$.next(this.totalResults$.value + 1);
  }

  private syncBills(): void {
    const newBillsLocal = this.billCacheService.getBillsToSync();
    
    const nrOfBillsToSync = newBillsLocal.length;
    let syncedBills = 0;

    const addBillObservables: Observable<void>[] = [];

    if (newBillsLocal.length > 0) {
      this.syncing$.next(true);

      newBillsLocal.forEach(bill => {
        addBillObservables.push(this.addBillInternal(bill));
      });
    }

    addBillObservables.forEach(observable => observable.subscribe(
      {
        next: _ => {
          syncedBills++;
          if (syncedBills >= nrOfBillsToSync) {
            this.syncing$.next(false);
            this.fetchBills();
          }
        } 
      }
    ));
  }

  private billCompareDateDescending(left: BillDto, right: BillDto): number {
    console.log(right.date.getTime());
    return right.date.getTime() - left.date.getTime();
  }
}
