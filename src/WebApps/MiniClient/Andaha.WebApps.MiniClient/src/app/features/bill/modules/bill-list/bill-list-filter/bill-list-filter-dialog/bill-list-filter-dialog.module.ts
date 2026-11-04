import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillListFilterDialogComponent } from './bill-list-filter-dialog.component';
import { DialogModule } from 'src/app/shared/dialog/dialog.module';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
    imports: [
        CommonModule,
        DialogModule,
        MatDialogModule,
        MatDatepickerModule,
        MatNativeDateModule,
        FormsModule,
        ReactiveFormsModule,
        MatIconModule,
        BillListFilterDialogComponent
    ]
})
export class BillListFilterDialogModule { }
