import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillListFilterDialogComponent } from './bill-list-filter-dialog.component';
import { DialogModule } from 'src/app/shared/dialog/dialog.module';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [
    BillListFilterDialogComponent
  ],
  imports: [
    CommonModule,
    DialogModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule
  ]
})
export class BillListFilterDialogModule { }
