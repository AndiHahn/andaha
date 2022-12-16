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
import { NgxImageZoomModule } from 'ngx-image-zoom';

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
    NgxImageZoomModule
  ]
})
export class BillImageDialogModule { }
