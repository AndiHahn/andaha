import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BillCategoryApiService } from '../api/shopping/bill-category-api.service';
import { BillCategoryDto } from '../api/shopping/models/BillCategoryDto';
import { ContextService } from '../core/context.service';

@Injectable({
  providedIn: 'root'
})
export class BillCategoryContextService {

  private categoryCacheKey = "andaha.bill.categories";
  
  private categoriesSubject: BehaviorSubject<BillCategoryDto[]>;

  constructor(
    private contextService: ContextService,
    private billCategoryApiService: BillCategoryApiService
  ) {
    this.categoriesSubject = new BehaviorSubject(this.getCategoriesFromStorage());

    this.initSubscriptions();
  }

  categories(): Observable<BillCategoryDto[]> {
    return this.categoriesSubject.asObservable();
  }
  
  private initSubscriptions(): void {
    this.contextService.shoppingApiReady().subscribe(
      {
        next: _ => this.fetchBillCategories()
      }
    );
  }

  private fetchBillCategories(): void {
    this.billCategoryApiService.getAll().subscribe(
      {
        next: categories => this.updateBillCategoriesInStorage(categories)
      }
    );
  }

  private updateBillCategoriesInStorage(categories: BillCategoryDto[]): void {
    if (!categories) {
      return;
    }

    const storageCategories = this.getCategoriesFromStorage().map(category => category.id).sort();
    
    const categoryIds = categories.map(category => category.id).sort();

    if (storageCategories.length != categories.length ||
        storageCategories.join(',') != categoryIds.join(',')) {
      const categoriesJson = JSON.stringify(categories);
      window.localStorage.setItem(this.categoryCacheKey, categoriesJson);

      this.categoriesSubject.next(categories);
    }
  }

  private getCategoriesFromStorage(): BillCategoryDto[] {
    const storageItems = window.localStorage.getItem(this.categoryCacheKey);
    
    if (storageItems) {
      return JSON.parse(storageItems) as BillCategoryDto[];
    }

    return [];
  }
}
