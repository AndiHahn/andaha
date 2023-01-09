import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ChartOptions } from 'chart.js';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { ExpenseDto } from 'src/app/api/shopping/dtos/ExpenseDto';
import { BillContextService } from 'src/app/features/bill/services/bill-context.service';
import { getDialogBaseConfig } from 'src/app/shared/dialog/dialog-functions';
import { ChartDetailsDialogComponent } from '../chart-details-dialog/chart-details-dialog.component';
import { ChartDetailsDialogData } from '../chart-details-dialog/ChartDetailsDialogData';
import { TimeRange } from '../timerange-selection/TimeRange';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent implements OnInit, OnChanges {

  @Input()
  expenses!: ExpenseDto[];

  @Input()
  categories!: CategoryDto[];

  @Input()
  selectedTimeRange?: TimeRange;

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

  constructor(
    private matDialog: MatDialog) {}

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
      
      const data: ChartDetailsDialogData = {
        expense: this.expenses[index]
      }

      const config = getDialogBaseConfig();
      config.data = data;

      this.matDialog.open(ChartDetailsDialogComponent, config).afterClosed().subscribe();
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
