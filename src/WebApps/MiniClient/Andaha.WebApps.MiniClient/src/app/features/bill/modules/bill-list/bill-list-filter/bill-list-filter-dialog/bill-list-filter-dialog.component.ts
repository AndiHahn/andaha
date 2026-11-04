import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogContent } from '@angular/material/dialog';
import { BillListFilterDialogData } from './BillListFilterDialogData';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GERMAN_DATE_PROVIDERS } from 'src/app/shared/date-picker/german-date-providers';
import { DialogComponent } from '../../../../../../shared/dialog/dialog.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatDatepickerInput, MatDatepickerToggle, MatDatepickerToggleIcon, MatDatepicker } from '@angular/material/datepicker';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-bill-list-filter-dialog',
    templateUrl: './bill-list-filter-dialog.component.html',
    styleUrls: ['./bill-list-filter-dialog.component.scss'],
    providers: GERMAN_DATE_PROVIDERS,
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [DialogComponent, CdkScrollable, MatDialogContent, MatDatepickerInput, FormsModule, ReactiveFormsModule, MatDatepickerToggle, MatIcon, MatDatepickerToggleIcon, MatDatepicker]
})
export class BillListFilterDialogComponent implements OnInit {
  private dialogRef = inject<MatDialogRef<BillListFilterDialogComponent>>(MatDialogRef);


  dateFrom: FormControl = new FormControl();
  dateUntil: FormControl = new FormControl();

  constructor() {
    const data = inject<BillListFilterDialogData>(MAT_DIALOG_DATA);

    if (data.from) {
      this.dateFrom.setValue(data.from);
    }

    if (data.until) {
      this.dateUntil.setValue(data.until);
    }
  }

  ngOnInit(): void {
  }

  onClearFromDateClick(): void {
    this.dateFrom.setValue('');
  }

  onClearUntilDateClick(): void {
    this.dateUntil.setValue('');
  }

  onTakeOverClick(): void {
    const data = this.getDialogData();

    this.dialogRef.close(data);
  }

  private getDialogData(): BillListFilterDialogData {
    return {
      from: this.dateFrom.value ? new Date(this.dateFrom.value) : undefined,
      until: this.dateUntil.value ? new Date(this.dateUntil.value) : undefined
    }
  }
}
