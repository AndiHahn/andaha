import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillOptionsDialogComponent } from './bill-options-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@NgModule({
  declarations: [ BillOptionsDialogComponent ],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressBarModule
  ]
})
export class BillOptionsDialogModule { }
