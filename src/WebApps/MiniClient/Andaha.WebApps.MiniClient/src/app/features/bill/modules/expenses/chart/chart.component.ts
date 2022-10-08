import { Component, Input, OnInit } from '@angular/core';
import { ChartOptions } from 'chart.js';
import { ExpenseDto } from 'src/app/api/shopping/dtos/ExpenseDto';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent implements OnInit {
  BORDER_COLOR = 'rgb(0,0,0)';

  @Input()
  expenses!: ExpenseDto[];

  /*
[data]="chartData"
[labels]="chartLabels"
[options]="chartOptions"
  */

  //CHART DATA
  chartLabels: string[] = [];
  chartData: number[] = [];
  chartOptions: ChartOptions = {
    responsive: true,
  }; 
  chartColors = [{
    backgroundColor: [],
    borderColor: []
  }];

   /*
  chartLegend = true;
  chartPlugins = [];
*/
  constructor() { }

  ngOnInit(): void {
    if (!this.expenses) {
      throw new Error("Expenses must be set in order to use this component");
    }
  }

  refreshChart() {
    this.clearChart();

    let backgroundColor: never[] = [];
    let borderColor: never[] = [];

    this.expenses.forEach(e => {
      this.chartLabels.push(e.category);
      this.chartData.push(e.costs);
      backgroundColor.push('red' as never); //this.categories.find(c => c.name == e.category).color)
      borderColor.push(this.BORDER_COLOR as never);
    });

    this.chartColors.push({ backgroundColor, borderColor });
    
    //this.updateExpensesDataComponent(expenses);
    //this.refreshDataAvailable();
  }

  clearChart() {
    this.chartLabels = [];
    this.chartData = [];
    this.chartColors = [];
  }
}
