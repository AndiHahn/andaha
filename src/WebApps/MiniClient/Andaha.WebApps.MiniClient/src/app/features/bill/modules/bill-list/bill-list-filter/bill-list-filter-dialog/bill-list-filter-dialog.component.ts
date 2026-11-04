import { Component, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BillListFilterDialogData } from './BillListFilterDialogData';
import {FormControl} from '@angular/forms';
import { GERMAN_DATE_PROVIDERS } from 'src/app/shared/date-picker/german-date-providers';

@Component({
  selector: 'app-bill-list-filter-dialog',
  templateUrl: './bill-list-filter-dialog.component.html',
  styleUrls: ['./bill-list-filter-dialog.component.scss'],
  providers: GERMAN_DATE_PROVIDERS,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class BillListFilterDialogComponent implements OnInit {

  dateFrom: FormControl = new FormControl();
  dateUntil: FormControl = new FormControl();

  constructor(
    private dialogRef: MatDialogRef<BillListFilterDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: BillListFilterDialogData
  ) {
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
