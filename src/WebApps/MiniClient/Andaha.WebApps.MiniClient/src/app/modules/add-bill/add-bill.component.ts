import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { BillCategoryDto } from 'src/app/api/shopping/models/BillCategoryDto';
import { BillCreateDto } from 'src/app/api/shopping/models/BillCreateDto';
import { ContextService } from 'src/app/core/context.service';
import { openErrorSnackbar, openInformationSnackbar } from 'src/app/shared/snackbar/snackbar-functions';

@Component({
  selector: 'app-add-bill',
  templateUrl: './add-bill.component.html',
  styleUrls: ['./add-bill.component.scss']
})
export class AddBillComponent implements OnInit {
  numberRegex: string = '^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$';

  isSaving: boolean = false;
  form: FormGroup;

  categories?: BillCategoryDto[];
  
  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private snackbar: MatSnackBar,
    private contextService: ContextService,
    private billApiService: BillApiService) { 
    this.form = this.fb.group({
      shopName: ['', [Validators.required, Validators.maxLength(200)]],
      notes: ['', [Validators.maxLength(1000)]],
      category: ['', Validators.required],
      price: ['', [Validators.min(0), Validators.pattern(this.numberRegex)]],
      date: [new Date()]
    })
  }

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

    const dto = this.createModelFromForm();

    this.billApiService.addBill(dto).subscribe(
      {
        next: _ => {
          this.isSaving = false;
          openInformationSnackbar('Rechnung gespeichert', this.snackbar);
          this.router.navigateByUrl("/");
        },
        error: (err) => {
          this.isSaving = false;

          let savingError = '';

          if (err.status == 400) {
            const errorKeys = (Object.keys(err.error.errors) as Array<string>);
            if (errorKeys.length > 0) {
              savingError = err.error.errors[errorKeys[0]][0];
            } else {
              savingError = err.error.detail;
            }
          } else {
            savingError = err.error.detail;
          }

          openErrorSnackbar(savingError, this.snackbar);
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
