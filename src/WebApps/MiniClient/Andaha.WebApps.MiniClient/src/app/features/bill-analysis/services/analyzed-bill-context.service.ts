import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { BillAnalyzedDto } from 'src/app/api/shopping/dtos/BillAnalyzedDto';
import { ContextService } from 'src/app/core/context.service';
import { SearchBillsParameters } from 'src/app/api/shopping/dtos/SearchBillsParameters';

@Injectable({ providedIn: 'root' })
export class AnalyzedBillContextService {
  private bills$: BehaviorSubject<BillAnalyzedDto[]> = new BehaviorSubject<BillAnalyzedDto[]>([]);
  private totalResults$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private pageIndex$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private pageSize$: BehaviorSubject<number> = new BehaviorSubject<number>(50);
  private loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private searchText: string = '';

  constructor(private billApi: BillApiService, private contextService: ContextService) {
    this.initSubscriptions();
    this.fetchAnalyzedBills();
  }

  bills(): Observable<BillAnalyzedDto[]> { return this.bills$.asObservable(); }
  totalResults(): Observable<number> { return this.totalResults$.asObservable(); }
  pageSize(): Observable<number> { return this.pageSize$.asObservable(); }
  loading(): Observable<boolean> { return this.loading$.asObservable(); }

  setPageSize(size: number) { if (size != this.pageSize$.value) { this.pageSize$.next(size); } }
  setPageIndex(index: number) { if (index != this.pageIndex$.value) { this.pageIndex$.next(index); } }
  setSearchText(text: string) { this.searchText = text; }

  refresh() { this.fetchAnalyzedBills(); }

  private initSubscriptions(): void {
    this.contextService
      .backendReady()
      .subscribe(
        {
          next: ready =>
          {
            if (ready)
            {
              this.fetchAnalyzedBills();
            }
          }
        });

    this.pageIndex$.asObservable().subscribe(_ => this.fetchAnalyzedBills());
    this.pageSize$.asObservable().subscribe(_ => this.fetchAnalyzedBills());
  }

  private fetchAnalyzedBills() {
    this.loading$.next(true);
    const params: SearchBillsParameters = {
      pageIndex: this.pageIndex$.value,
      pageSize: this.pageSize$.value,
      search: this.searchText
    };

    this.billApi.getAnalyzedBills(params).subscribe({
      next: result => {
        this.loading$.next(false);
        this.bills$.next(result);
        this.totalResults$.next(result.length);
      },
      error: _ => this.loading$.next(false)
    });
  }

  fetchNextBills(): void {
    if ((this.pageIndex$.value + 1) * this.pageSize$.value >= this.totalResults$.value) {
      return;
    }

    this.setPageIndex(this.pageIndex$.value + 1);
  }

  getBillById(id: string): BillAnalyzedDto | undefined {
    return this.bills$.value.find(b => b.id == id);
  }
}
