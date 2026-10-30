import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartComponent } from './chart.component';
import { NgChartsModule } from 'ng2-charts';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [
    ChartComponent
  ],
  imports: [
    CommonModule,
    NgChartsModule,
    MatIconModule
  ],
  exports: [
    ChartComponent
  ]
})
export class ChartModule { }
