import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AnalyzedBillImageModule } from '../analyzed-bill-image/analyzed-bill-image.module';
import { AnalyzedBillDetailsComponent } from './analyzed-bill-details.component';

const routes: Routes = [
  {
    path: '',
    component: AnalyzedBillDetailsComponent
  }
];

@NgModule({
  declarations: [AnalyzedBillDetailsComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    AnalyzedBillImageModule
  ]
})
export class AnalyzedBillDetailsModule { }
