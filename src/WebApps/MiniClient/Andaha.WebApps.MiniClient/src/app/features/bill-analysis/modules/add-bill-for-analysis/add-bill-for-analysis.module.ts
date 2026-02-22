import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AddBillForAnalysisComponent } from './add-bill-for-analysis.component';

const routes: Routes = [ { path: '', component: AddBillForAnalysisComponent } ];

@NgModule({
  declarations: [AddBillForAnalysisComponent],
  imports: [CommonModule, RouterModule.forChild(routes), MatButtonModule, MatIconModule, MatProgressBarModule, MatSnackBarModule]
})
export class AddBillForAnalysisModule {}
