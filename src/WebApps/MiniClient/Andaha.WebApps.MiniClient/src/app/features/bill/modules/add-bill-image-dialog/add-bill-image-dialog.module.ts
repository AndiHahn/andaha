import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddBillImageDialogComponent } from './add-bill-image-dialog.component';
import { DialogModule } from 'src/app/shared/dialog/dialog.module';
import { MatDialogModule } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio'
import { WebcamModule } from 'ngx-webcam';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

@NgModule({
  declarations: [
    AddBillImageDialogComponent
  ],
  imports: [
    CommonModule,
    DialogModule,
    MatDialogModule,
    MatRadioModule,
    WebcamModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule
  ]
})
export class AddBillImageDialogModule { }
