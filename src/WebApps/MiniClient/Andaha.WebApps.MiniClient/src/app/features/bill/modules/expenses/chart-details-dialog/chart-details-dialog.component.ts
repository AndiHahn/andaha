import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogContent } from '@angular/material/dialog';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { ExpenseSubCategoryDto } from 'src/app/api/shopping/dtos/ExpenseSubCategoryDto';
import { ChartDetailsDialogData } from './ChartDetailsDialogData';
import { DialogComponent } from '../../../../../shared/dialog/dialog.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { DecimalPipe } from '@angular/common';

@Component({
    selector: 'app-chart-details-dialog',
    templateUrl: './chart-details-dialog.component.html',
    styleUrls: ['./chart-details-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [DialogComponent, CdkScrollable, MatDialogContent, DecimalPipe]
})
export class ChartDetailsDialogComponent implements OnInit {

  categoryName: string;
  sum: number;
  subCategoryExpenses: ExpenseSubCategoryDto[];

  constructor() {
    const data = inject<ChartDetailsDialogData>(MAT_DIALOG_DATA);

    this.categoryName = data.expense.category;
    this.sum = data.expense.costs;
    this.subCategoryExpenses = data.expense.subCategories;
  }

  ngOnInit(): void {
  }

  truncate(decimals: number, value?: number): number {
    if (value) {
      return Number(value.toFixed(decimals));
    }

    return 0.0;
  }
}
