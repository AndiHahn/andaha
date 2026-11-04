import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { BillAnalyzedDto } from 'src/app/api/shopping/dtos/BillAnalyzedDto';
import { AnalyzedBillContextService } from '../../services/analyzed-bill-context.service';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { SubCategoryDto } from 'src/app/api/shopping/dtos/SubCategoryDto';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { confidencePercent, resolveAnalyzedCategory } from '../../functions/analyzed-bill-functions';
import { getParametersFromRouteRecursive, leaveDetailNotFound } from 'src/app/shared/utils/routing-helper';

@Component({
  selector: 'app-analyzed-bill-details',
  templateUrl: './analyzed-bill-details.component.html',
  styleUrls: ['./analyzed-bill-details.component.scss'],
  standalone: false
})
export class AnalyzedBillDetailsComponent implements OnInit, OnDestroy {
  bill?: BillAnalyzedDto;
  isLoading: boolean = false;
  category?: CategoryDto;
  subCategory?: SubCategoryDto;
  confidence: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackbar: MatSnackBar,
    private analyzedContext: AnalyzedBillContextService,
    private categoryContext: BillCategoryContextService
  ) {
  }

  ngOnInit(): void {
    const billId = getParametersFromRouteRecursive(this.route.snapshot)['id'];
    if (!billId) {
      leaveDetailNotFound(this.router, this.snackbar, '/analyzed/list');
      return;
    }

    this.analyzedContext.byId(billId).pipe(takeUntil(this.destroy$)).subscribe(bill => {
      if (!bill) {
        leaveDetailNotFound(this.router, this.snackbar, '/analyzed/list');
        return;
      }

      this.bill = bill;
      this.confidence = confidencePercent(bill.confidence);

      this.categoryContext.categories().pipe(takeUntil(this.destroy$)).subscribe(categories => {
        const resolved = resolveAnalyzedCategory(categories, bill.categoryId, bill.subCategoryId);
        this.category = resolved.category;
        this.subCategory = resolved.subCategory;
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }
}
