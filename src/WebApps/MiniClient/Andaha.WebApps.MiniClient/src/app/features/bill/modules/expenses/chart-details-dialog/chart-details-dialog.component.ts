import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { ExpenseSubCategoryDto } from 'src/app/api/shopping/dtos/ExpenseSubCategoryDto';
import { ChartDetailsDialogData } from './ChartDetailsDialogData';

@Component({
  selector: 'app-chart-details-dialog',
  templateUrl: './chart-details-dialog.component.html',
  styleUrls: ['./chart-details-dialog.component.scss']
})
export class ChartDetailsDialogComponent implements OnInit {

  categoryName: string;
  sum: number;
  subCategoryExpenses: ExpenseSubCategoryDto[];

  constructor(@Inject(MAT_DIALOG_DATA) data: ChartDetailsDialogData) {
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
