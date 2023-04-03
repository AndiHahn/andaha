import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { BillCategoryApiService } from '../api/shopping/bill-category-api.service';
import { CategoryDto } from '../api/shopping/dtos/CategoryDto';
import { CategoryUpdateDto } from '../api/shopping/dtos/CategoryUpdateDto';
import { ContextService } from '../core/context.service';
import { BillContextService } from '../features/bill/services/bill-context.service';

@Injectable({
  providedIn: 'root'
})
export class BillCategoryContextService {
  
  private categories$: BehaviorSubject<CategoryDto[]> = new BehaviorSubject<CategoryDto[]>([]);

  constructor(
    private contextService: ContextService,
    private billCategoryApiService: BillCategoryApiService,
    private billContextService: BillContextService
  ) {
    this.initSubscriptions();
    this.fetchBillCategories();
  }

  categories(): Observable<CategoryDto[]> {
    return this.categories$.asObservable();
  }

  updateCategories(categories: CategoryUpdateDto[]): Observable<void> {
    return this.bulkUpdate(categories);
  }
  
  private initSubscriptions(): void {
    this.contextService.backendReady().subscribe(
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
        next: categories => this.categories$.next(categories.sort(this.compareCategoryOrder))
      }
    );
  }

  private bulkUpdate(categories: CategoryUpdateDto[]): Observable<void> {
    const returnSubject = new Subject<void>();

    this.billCategoryApiService.bulkUpdate(categories).subscribe(
      {
        next: _ => {
          this.fetchBillCategories();
          this.billContextService.refreshBills();
          returnSubject.next();
        },
        error: error => {
          returnSubject.error(error);
        }
      }
    );

    return returnSubject.asObservable();
  }

  private compareCategoryOrder(left: CategoryDto, right: CategoryDto): number {
    return right.order - left.order;
  }
}
