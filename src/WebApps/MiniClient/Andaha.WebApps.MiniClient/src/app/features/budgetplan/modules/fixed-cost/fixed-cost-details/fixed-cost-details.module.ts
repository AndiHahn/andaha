import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FixedCostDetailsComponent } from './fixed-cost-details.component';
import { RouterModule, Routes } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AppSnackbarModule } from 'src/app/shared/snackbar/snackbar.module';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

const routes: Routes = [
  {
    path: '',
    component: FixedCostDetailsComponent
  }
];

@NgModule({
  declarations: [
    FixedCostDetailsComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    AppSnackbarModule,
    MatSnackBarModule,
    MatIconModule
  ]
})
export class FixedCostDetailsModule { }
