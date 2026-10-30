import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ErrorSnackbarComponent } from './error-snackbar/error-snackbar.component';
import { InformationSnackbarComponent } from './information-snackbar/information-snackbar.component';

@NgModule({
  declarations: [
    ErrorSnackbarComponent,
    InformationSnackbarComponent
  ],
  imports: [
    CommonModule,
    MatIconModule
  ]
})
export class AppSnackbarModule {}
