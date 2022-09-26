import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BillCategoryApiService } from '../api/shopping/bill-category-api.service';
import { BillCategoryDto } from '../api/shopping/dtos/BillCategoryDto';
import { ContextService } from '../core/context.service';

@Injectable({
  providedIn: 'root'
})
export class BillCategoryContextService {
  
  private categoriesSubject: BehaviorSubject<BillCategoryDto[]> = new BehaviorSubject<BillCategoryDto[]>([]);

  constructor(
    private contextService: ContextService,
    private billCategoryApiService: BillCategoryApiService
  ) {
    this.initSubscriptions();
    this.fetchBillCategories();
  }

  categories(): Observable<BillCategoryDto[]> {
    return this.categoriesSubject.asObservable();
  }
  
  private initSubscriptions(): void {
    this.contextService.shoppingApiReady().subscribe(
      {
        next: ready => {
          if (ready) {
            this.fetchBillCategories();
          }
        }
      }
    );
  }

  private fetchBillCategories(): void {
    this.billCategoryApiService.getAll().subscribe(
      {
        next: categories => this.categoriesSubject.next(categories)
      }
    );
  }
}
