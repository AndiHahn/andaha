import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BillAnalyzedDto } from 'src/app/api/shopping/dtos/BillAnalyzedDto';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { SubCategoryDto } from 'src/app/api/shopping/dtos/SubCategoryDto';
import { confidencePercent, resolveAnalyzedCategory } from '../../../functions/analyzed-bill-functions';

@Component({
  selector: 'app-analyzed-bill-list-item',
  templateUrl: './analyzed-bill-list-item.component.html',
  styleUrls: ['./analyzed-bill-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class AnalyzedBillListItemComponent implements OnInit {

  @Input()
  bill!: BillAnalyzedDto;

  @Input()
  categories: CategoryDto[] = [];

  constructor() { }

  ngOnInit(): void {
    if (!this.bill) {
      throw new Error("Bill is required in order to use this component");
    }
  }

  get category(): CategoryDto | undefined {
    return resolveAnalyzedCategory(this.categories, this.bill.categoryId, this.bill.subCategoryId).category;
  }

  get subCategory(): SubCategoryDto | undefined {
    return resolveAnalyzedCategory(this.categories, this.bill.categoryId, this.bill.subCategoryId).subCategory;
  }

  get confidence(): number | null {
    return confidencePercent(this.bill.confidence);
  }
}
