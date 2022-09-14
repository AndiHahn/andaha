import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { BillDto } from 'src/app/api/shopping/models/BillDto';
import { ContextService } from 'src/app/core/context.service';
import { BillCreateDto } from '../api/shopping/models/BillCreateDto';

@Injectable({
  providedIn: 'root'
})
export class BillContextService {
  private billsSubject: BehaviorSubject<BillDto[]> = new BehaviorSubject<BillDto[]>([]);
  private totalResultsSubject: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private pageIndexSubject: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private pageSizeSubject: BehaviorSubject<number> = new BehaviorSubject<number>(20);

  constructor(
    private billApiService: BillApiService,
    private contextService: ContextService
  ) {
    this.initSubscriptions();
  }

  bills(): Observable<BillDto[]> {
    return this.billsSubject.asObservable();
  }

  totalResults(): Observable<number> {
    return this.totalResultsSubject.asObservable();
  }

  pageSize(): Observable<number> {
    return this.pageSizeSubject.asObservable();
  }

  setPageSize(size: number): void {
    if (size != this.pageSizeSubject.value) {
      this.pageSizeSubject.next(size);
    }
  }

  setPageIndex(index: number): void {
    if (index != this.pageIndexSubject.value) {
      this.pageIndexSubject.next(index);
    }
  }

  addBill(dto: BillCreateDto): Observable<BillDto> {
    const returnSubject = new Subject<BillDto>();

    this.billApiService.addBill(dto).subscribe(
      {
        next: result => {
          const bills = [result].concat(this.billsSubject.value);
          if (bills.length > this.pageSizeSubject.value) {
            bills.pop();
          }

          this.billsSubject.next(bills);
          this.totalResultsSubject.next(this.totalResultsSubject.value + 1);
          
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
        next: _ => this.fetchBills()
      }
    );

    this.pageIndexSubject.asObservable().subscribe(
      {
        next: _ => this.fetchBills()
      }
    );

    this.pageSizeSubject.asObservable().subscribe(
      {
        next: _ => this.fetchBills()
      }
    );
  }

  private fetchBills() {
    this.billApiService
      .searchBills(
        {
          pageIndex: this.pageIndexSubject.value,
          pageSize: this.pageSizeSubject.value
        })
      .subscribe(
        {
          next: result => {
            this.billsSubject.next(result.values);
            this.totalResultsSubject.next(result.totalCount);
          }
        }
    );
  }
}
