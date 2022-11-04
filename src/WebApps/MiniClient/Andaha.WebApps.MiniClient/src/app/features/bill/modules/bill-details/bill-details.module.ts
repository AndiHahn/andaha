import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillDetailsComponent } from './bill-details.component';
import { RouterModule, Routes } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BillImageModule } from '../bill-image/bill-image.module';

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
    MatButtonModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatSelectModule,
    MatProgressBarModule,
    BillImageModule
  ]
})
export class BillDetailsModule { }
