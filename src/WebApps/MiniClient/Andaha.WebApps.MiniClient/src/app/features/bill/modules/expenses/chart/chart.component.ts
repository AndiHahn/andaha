import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ChartOptions } from 'chart.js';
import { BillCategoryDto } from 'src/app/api/shopping/dtos/BillCategoryDto';
import { ExpenseDto } from 'src/app/api/shopping/dtos/ExpenseDto';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent implements OnInit, OnChanges {

  @Input()
  expenses!: ExpenseDto[];

  @Input()
  categories!: BillCategoryDto[];

  //CHART DATA
  chartLabels: string[] = [];
  chartData: number[] = [];
  chartDatasets = [
    {
      data: [ 1 ],
      backgroundColor: [ 'red' ]
    }
  ];
  chartOptions: ChartOptions = {
    responsive: true,
  }; 
  chartColors = [{
    backgroundColor: [],
    borderColor: []
  }];

  ngOnInit(): void {
    if (!this.expenses) {
      throw new Error("Expenses must be set in order to use this component");
    }

    if (!this.categories) {
      throw new Error("Categories must be set in order to use this component");
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.['expenses']) {
      this.refreshChart();
    }
  }

  public chartClicked(event: any): void {
    if (event.active.length > 0) {
      const index = event.active[0].index;

      console.log("clicked on: " + this.expenses[index].category);
    }
  }

  refreshChart() {
    const labels: string[] = [];
    const data: number[] = [];
    const colors: string[] = [];

    this.expenses.forEach(e => {
      labels.push(e.category);
      data.push(e.costs);
      colors.push(this.categories.find(c => c.name == e.category)!.color);
    });

    this.clearChart();

    this.chartDatasets = [
      {
        data: data,
        backgroundColor: colors
      }
    ];

    this.chartLabels = labels;
  }

  clearChart() {
    this.chartLabels = [];
    this.chartDatasets[0].data = [];
    this.chartColors = [];
  }
}
