import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BillListFilterDialogData } from './BillListFilterDialogData';
import {FormControl} from '@angular/forms';
import {MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS} from '@angular/material-moment-adapter';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';

export const MY_FORMATS = {
  parse: {
    dateInput: 'LL',
  },
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'DD.MM.YYYY',
    monthYearA11yLabel: 'MMMM YYYY'
  },
};

@Component({
  selector: 'app-bill-list-filter-dialog',
  templateUrl: './bill-list-filter-dialog.component.html',
  styleUrls: ['./bill-list-filter-dialog.component.scss'],
  providers: [
    // `MomentDateAdapter` can be automatically provided by importing `MomentDateModule` in your
    // application's root module. We provide it at the component level here, due to limitations of
    // our example generation script.
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },

    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ],
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
