import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillImageDialogComponent } from './bill-image-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DialogModule } from 'src/app/shared/dialog/dialog.module';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { PinchZoomModule } from '@olafvv/ngx-pinch-zoom';

@NgModule({
  declarations: [
    BillImageDialogComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    DialogModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    PinchZoomModule //original project: https://github.com/drozhzhin-n-e/ngx-pinch-zoom (no longer maintained since angular 11)
  ]
})
export class BillImageDialogModule { }
