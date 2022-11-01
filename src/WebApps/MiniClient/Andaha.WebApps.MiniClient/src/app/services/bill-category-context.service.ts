import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { BillCategoryApiService } from '../api/shopping/bill-category-api.service';
import { BillCategoryDto } from '../api/shopping/dtos/BillCategoryDto';
import { BillCategoryUpdateDto } from '../api/shopping/dtos/BillCategoryUpdateDto';
import { ContextService } from '../core/context.service';
import { openErrorSnackbar } from '../shared/snackbar/snackbar-functions';
import { BillContextService } from './bill-context.service';

@Injectable({
  providedIn: 'root'
})
export class BillCategoryContextService {
  
  private categories$: BehaviorSubject<BillCategoryDto[]> = new BehaviorSubject<BillCategoryDto[]>([]);

  constructor(
    private snackbar: MatSnackBar,
    private contextService: ContextService,
    private billCategoryApiService: BillCategoryApiService,
    private billContextService: BillContextService
  ) {
    this.initSubscriptions();
    this.fetchBillCategories();
  }

  categories(): Observable<BillCategoryDto[]> {
    return this.categories$.asObservable();
  }

  updateCategories(categories: BillCategoryUpdateDto[]): Observable<void> {
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
        next: categories => this.categories$.next(categories.sort(this.compareCategoryDefaultFirst))
      }
    );
  }

  private bulkUpdate(categories: BillCategoryUpdateDto[]): Observable<void> {
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

  private compareCategoryDefaultFirst(left: BillCategoryDto, right: BillCategoryDto): number {
    return Number(right.isDefault) - Number(left.isDefault);
  }
}
