import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
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
    AnalyzedBillImageModule
  ]
})
export class AnalyzedBillDetailsModule { }
