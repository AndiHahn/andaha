import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillImageComponent } from './bill-image.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { WebcamModule } from 'ngx-webcam';

@NgModule({
  declarations: [
    BillImageComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  exports: [
    BillImageComponent
  ]
})
export class BillImageModule { }
