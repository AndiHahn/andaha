import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BillCategoryApiService } from '../api/shopping/bill-category-api.service';
import { BillCategoryDto } from '../api/shopping/models/BillCategoryDto';
import { ShoppingApiService } from '../api/shopping/shopping-api.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ContextService {
  private categoryCacheKey = "andaha.bill.categories";

  private categoriesSubject: BehaviorSubject<BillCategoryDto[]>;

  constructor(
    private shoppingApiService: ShoppingApiService,
    private billCategoryApiService: BillCategoryApiService) {
    this.wakeUpBackendServices();

    this.categoriesSubject = new BehaviorSubject(this.getCategoriesFromStorage());
  }

  categories(): Observable<BillCategoryDto[]> {
    return this.categoriesSubject.asObservable();
  }

  private wakeUpBackendServices() {
    this.shoppingApiService.wakeUp().subscribe({
      next: _ => this.refreshBillCategoriesInStorage()
    });
  }

  private refreshBillCategoriesInStorage() {
    this.billCategoryApiService.getAll().subscribe(
      {
        next: categories => this.updateBillCategoriesInStorage(categories)
      }
    )
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
