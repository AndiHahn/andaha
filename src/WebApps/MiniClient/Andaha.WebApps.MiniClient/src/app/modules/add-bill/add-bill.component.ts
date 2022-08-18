import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { BillCategoryDto } from 'src/app/api/shopping/models/BillCategoryDto';
import { BillCreateDto } from 'src/app/api/shopping/models/BillCreateDto';
import { ContextService } from 'src/app/core/context.service';

@Component({
  selector: 'app-add-bill',
  templateUrl: './add-bill.component.html',
  styleUrls: ['./add-bill.component.scss']
})
export class AddBillComponent implements OnInit {
  isSaving: boolean = false;
  savingFailed: boolean = false;
  savingError: string = '';
  form: FormGroup;

  categories?: BillCategoryDto[];
  
  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private contextService: ContextService,
    private billApiService: BillApiService) { 
    this.form = this.fb.group({
      shopName: ['', [Validators.required, Validators.maxLength(200)]],
      notes: ['', [Validators.maxLength(1000)]],
      category: ['', Validators.required],
      price: ['', [Validators.min(0), Validators.pattern(this.numberRegex)]],
      date: [new Date()]
    });
  }

  numberRegex: string = '^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$';

  ngOnInit(): void {
    this.loadBillCategories();
  }

  private loadBillCategories() {
    this.contextService.categories().subscribe({
      next: categories => this.categories = categories
    })
  }

  onSubmit() {
    if (!this.form.valid) {
      return;
    }

    this.isSaving = true;
    this.savingFailed = false;

    const dto = this.createModelFromForm();

    this.billApiService.addBill(dto).subscribe(
      {
        next: _ => {
          this.isSaving = false;
          this.router.navigateByUrl("/");
        },
        error: (err) => {
          this.isSaving = false;
          this.savingFailed = true;

          if (err.status == 400) {
            const errorKeys = (Object.keys(err.error.errors) as Array<string>);
            if (errorKeys.length > 0) {
              this.savingError = err.error.errors[errorKeys[0]][0];
            } else {
              this.savingError = err.error.detail;
            }
          } else {
            this.savingError = err.error.detail;
          }
        }
      }
    );
  }

  private createModelFromForm(): BillCreateDto {
    const controls = this.form.controls;
    return {
      categoryId: controls['category'].value.id,
      shopName: controls['shopName'].value,
      price: controls['price'].value,
      date: controls['date']?.value,
      notes: controls['notes']?.value
    }
  }
}
