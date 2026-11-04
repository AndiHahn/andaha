import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartComponent } from './chart.component';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [
    ChartComponent
  ],
  imports: [
    CommonModule,
    BaseChartDirective,
    MatIconModule
  ],
  // ng2-charts 11: Chart.js-Registrierung per Provider (vorher NgChartsModule). Hier statt im
  // AppModule, damit chart.js wie bisher nur im Statistik-Chunk geladen wird.
  providers: [
    provideCharts(withDefaultRegisterables())
  ],
  exports: [
    ChartComponent
  ]
})
export class ChartModule { }
