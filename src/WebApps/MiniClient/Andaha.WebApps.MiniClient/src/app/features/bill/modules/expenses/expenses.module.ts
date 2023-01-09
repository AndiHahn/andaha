import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpensesComponent } from './expenses.component';
import { RouterModule, Routes } from '@angular/router';
import { TimerangeSelectionModule } from './timerange-selection/timerange-selection.module';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChartModule } from './chart/chart.module';
import { MatDividerModule } from '@angular/material/divider';
import { ChartDetailsDialogModule } from './chart-details-dialog/chart-details-dialog.module';

const routes: Routes = [
  {
    path: '',
    component: ExpensesComponent
  }
]

@NgModule({
  declarations: [
    ExpensesComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TimerangeSelectionModule,
    MatProgressSpinnerModule,
    ChartModule,
    ChartDetailsDialogModule,
    MatDividerModule
  ]
})
export class ExpensesModule { }
