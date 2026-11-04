import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddBillComponent } from './add-bill.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker'
import { RouterModule, Routes } from '@angular/router';
import { MatNativeDateModule } from '@angular/material/core';
import { AppSnackbarModule } from 'src/app/shared/snackbar/snackbar.module';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { BillImageModule } from '../bill-image/bill-image.module';
import { ShowErrorModule } from 'src/app/shared/form-field/show-error.module';

const routes: Routes = [
  {
    path: '',
    component: AddBillComponent
  }
];

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        FormsModule,
        ReactiveFormsModule,
        AppSnackbarModule,
        MatSnackBarModule,
        MatIconModule,
        BillImageModule,
        ShowErrorModule,
        AddBillComponent
    ],
    providers: [
        MatDatepickerModule
    ]
})
export class AddBillModule { }
