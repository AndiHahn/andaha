import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import { afterFirstLoad } from '../shared/utils/load-state';
import { BillCategoryApiService } from '../api/shopping/bill-category-api.service';
import { CategoryDto } from '../api/shopping/dtos/CategoryDto';
import { CategoryUpdateDto } from '../api/shopping/dtos/CategoryUpdateDto';
import { ContextService } from '../core/context.service';
import { BillContextService } from '../features/bill/services/bill-context.service';
import { CategoryCreateDto } from '../api/shopping/dtos/CategoryCreateDto';
import { CategoryOrderDto } from '../api/shopping/dtos/CategoryOrderDto';

@Injectable({
  providedIn: 'root'
})
export class BillCategoryContextService {
  private contextService = inject(ContextService);
  private billCategoryApiService = inject(BillCategoryApiService);
  private billContextService = inject(BillContextService);

  
  private categories$: BehaviorSubject<CategoryDto[]> = new BehaviorSubject<CategoryDto[]>([]);
  private loadState$ = new ReplaySubject<'loaded' | 'failed'>(1);
  private backendIsReady: boolean = false;

  constructor() {
    this.initSubscriptions();
    this.fetchBillCategories();
  }

  categories(): Observable<CategoryDto[]> {
    return this.categories$.asObservable();
  }

  createCategory(category: CategoryCreateDto): Observable<CategoryDto> {
    const returnSubject = new Subject<CategoryDto>();

    this.billCategoryApiService.create(category).subscribe(
      {
        next: createdCategory => {
          this.categories$.next(this.categories$.value.concat(createdCategory));
          returnSubject.next(createdCategory);
        },
        error: error => returnSubject.error(error)
      }
    );

    return returnSubject.asObservable();
  }

  updateCategory(id: string, category: CategoryUpdateDto): Observable<void> {
    return this.update(id, category);
  }

  updateCategoryOrders(categoryOrders: CategoryOrderDto[]): Observable<void> {
    const returnSubject = new Subject<void>();

    this.billCategoryApiService.updateOrders(categoryOrders).subscribe(
      {
        next: _ => {
          this.billContextService.refreshBills();
          returnSubject.next();
        },
        error: error => {
          this.fetchBillCategories();
          returnSubject.error(error);
        }
      }
    );

    return returnSubject.asObservable();
  }

  getCategoryById(id: string): CategoryDto | undefined {
    return this.categories$.value.find(category => category.id == id);
  }

  categoryById(id: string): Observable<CategoryDto | undefined> {
    return afterFirstLoad(this.loadState$, () => this.getCategoryById(id));
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
          this.backendIsReady = ready;
          if (ready) {
            this.fetchBillCategories();
          }
        }
      }
    );
  }

  private fetchBillCategories(onDone?: () => void): void {
    this.billCategoryApiService.getAll().subscribe(
      {
        next: categories => {
          this.categories$.next(categories);
          this.loadState$.next('loaded');
          onDone?.();
        },
        error: _ => {
          if (this.backendIsReady) {
            this.loadState$.next('failed');
          }
          onDone?.();
        }
      }
    );
  }

  private update(id: string, category: CategoryUpdateDto): Observable<void> {
    const returnSubject = new Subject<void>();

    this.billCategoryApiService.update(id, category).subscribe(
      {
        next: _ => {
          // Erst nach dem Neuladen melden, damit Aufrufer den gespeicherten Stand (inkl. Server-IDs) lesen koennen.
          this.fetchBillCategories(() => returnSubject.next());
          this.billContextService.refreshBills();
        },
        error: error => {
          returnSubject.error(error);
        }
      }
    );

    return returnSubject.asObservable();
  }
}
