import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpensesComponent } from './expenses.component';
import { RouterModule, Routes } from '@angular/router';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChartModule } from './chart/chart.module';


const routes: Routes = [
  {
    path: '',
    component: ExpensesComponent
  }
]

@NgModule({
    imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatProgressSpinnerModule,
    ChartModule,
    ExpensesComponent
]
})
export class ExpensesModule { }
