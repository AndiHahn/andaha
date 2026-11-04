import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddPersonComponent } from './add-person.component';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppSnackbarModule } from 'src/app/shared/snackbar/snackbar.module';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ShowErrorModule } from 'src/app/shared/form-field/show-error.module';

const routes: Routes = [
  {
    path: '',
    component: AddPersonComponent
  }
];

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        FormsModule,
        ReactiveFormsModule,
        AppSnackbarModule,
        MatSnackBarModule,
        MatIconModule,
        MatProgressSpinnerModule,
        ShowErrorModule,
        AddPersonComponent
    ]
})
export class AddPersonModule { }
