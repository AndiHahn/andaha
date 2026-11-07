import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BillAnalyzedDto } from 'src/app/api/shopping/dtos/BillAnalyzedDto';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { SubCategoryDto } from 'src/app/api/shopping/dtos/SubCategoryDto';
import { confidencePercent, resolveAnalyzedCategory } from '../../../functions/analyzed-bill-functions';
import { DecimalPipe, DatePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { notCreatedReasonTexts } from '../../../functions/not-created-reasons';

@Component({
    selector: 'app-analyzed-bill-list-item',
    templateUrl: './analyzed-bill-list-item.component.html',
    styleUrls: ['./analyzed-bill-list-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [DecimalPipe, DatePipe, MatIcon]
})
export class AnalyzedBillListItemComponent implements OnInit {

  @Input()
  bill!: BillAnalyzedDto;

  @Input()
  categories: CategoryDto[] = [];

  /** gerade fertig analysiert (US-0009): kurz hervorheben wie die neue Zeile in der Rechnungsliste */
  @Input()
  isNew = false;

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

  /** Kurztexte, warum die Analyse nicht automatisch angelegt wurde (US-0011), mit " · " verbunden */
  get reasons(): string {
    return notCreatedReasonTexts(this.bill.notCreatedReasons).map(r => r.short).join(' · ');
  }
}
