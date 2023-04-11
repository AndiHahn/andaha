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

  updateCategory(id: string, category: CategoryUpdateDto): Observable<void> {
    return this.update(id, category);
  }

  updateCategories(categories: CategoryUpdateDto[]): Observable<void> {
    return this.bulkUpdate(categories);
  }

  getCategoryById(id: string): CategoryDto | undefined {
    return this.categories$.value.find(category => category.id == id);
  }

  deleteCategory(id: string): Observable<void> {
    const returnSubject = new Subject<void>();

    const categoriesWithoutDeleted = this.categories$.value.filter(category => category.id != id);
    this.categories$.next(categoriesWithoutDeleted);

    this.billCategoryApiService.delete(id).subscribe(
      {
        next: _ => {
          returnSubject.next();
        },
        error: error => {
          this.fetchBillCategories();
          this.billContextService.refreshBills();
          returnSubject.error(error);
        } 
      }
    );

    return returnSubject.asObservable();
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
        next: categories => this.categories$.next(categories)
      }
    );
  }

  private update(id: string, category: CategoryUpdateDto): Observable<void> {
    const returnSubject = new Subject<void>();

    this.billCategoryApiService.update(id, category).subscribe(
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
}
