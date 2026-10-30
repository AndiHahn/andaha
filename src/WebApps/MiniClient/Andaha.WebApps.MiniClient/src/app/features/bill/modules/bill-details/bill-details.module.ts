import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillDetailsComponent } from './bill-details.component';
import { RouterModule, Routes } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BillImageModule } from '../bill-image/bill-image.module';
import { ShowErrorModule } from 'src/app/shared/form-field/show-error.module';

const routes: Routes = [
  {
    path: '',
    component: BillDetailsComponent
  }
];

@NgModule({
  declarations: [
    BillDetailsComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatSelectModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    BillImageModule,
    ShowErrorModule
  ]
})
export class BillDetailsModule { }
