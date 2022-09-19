import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, skip } from 'rxjs';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { BillDto } from 'src/app/api/shopping/models/BillDto';
import { ContextService } from 'src/app/core/context.service';
import { BillCreateDto } from '../api/shopping/models/BillCreateDto';

@Injectable({
  providedIn: 'root'
})
export class BillContextService {
  private bills$: BehaviorSubject<BillDto[]> = new BehaviorSubject<BillDto[]>([]);
  private totalResults$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private pageIndex$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private pageSize$: BehaviorSubject<number> = new BehaviorSubject<number>(20);
  private loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private searchText: string = '';

  constructor(
    private billApiService: BillApiService,
    private contextService: ContextService
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

  addBill(dto: BillCreateDto): Observable<BillDto> {
    const returnSubject = new Subject<BillDto>();

    this.billApiService.addBill(dto).subscribe(
      {
        next: result => {
          const bills = [result].concat(this.bills$.value);
          if (bills.length > this.pageSize$.value) {
            bills.pop();
          }

          this.bills$.next(bills);
          this.totalResults$.next(this.totalResults$.value + 1);
          
          returnSubject.next(result);
        },
        error: error => returnSubject.error(error)
      }
    );

    return returnSubject.asObservable();
  }

  private initSubscriptions(): void {
    this.contextService.shoppingApiReady().subscribe(
      {
        next: ready => {
          if (ready) {
            this.fetchBills();
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
      if (!currentBillList.some(n => n.id == bill.id)) {
        currentBillList.push(bill);
      }
    });

    this.bills$.next(currentBillList);
  }
}
