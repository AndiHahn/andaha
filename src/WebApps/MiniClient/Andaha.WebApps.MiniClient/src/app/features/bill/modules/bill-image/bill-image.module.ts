import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillImageComponent } from './bill-image.component';
import { MatIconModule } from '@angular/material/icon';
import { WebcamModule } from 'ngx-webcam';

@NgModule({
  declarations: [
    BillImageComponent
  ],
  imports: [
    CommonModule,
    MatIconModule
  ],
  exports: [
    BillImageComponent
  ]
})
export class BillImageModule { }
