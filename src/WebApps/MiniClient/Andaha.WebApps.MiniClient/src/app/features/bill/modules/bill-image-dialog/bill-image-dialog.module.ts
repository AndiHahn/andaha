import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillImageDialogComponent } from './bill-image-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DialogModule } from 'src/app/shared/dialog/dialog.module';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { PinchZoomComponent } from '@meddv/ngx-pinch-zoom';

@NgModule({
  declarations: [
    BillImageDialogComponent
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    DialogModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    PinchZoomComponent // fork of https://github.com/drozhzhin-n-e/ngx-pinch-zoom (standalone component, Angular 19+)
  ]
})
export class BillImageDialogModule { }
