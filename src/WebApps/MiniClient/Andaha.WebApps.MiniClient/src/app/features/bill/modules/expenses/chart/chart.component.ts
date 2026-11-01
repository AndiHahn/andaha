import { Component, EventEmitter, Input, OnChanges, Output, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ChartOptions } from 'chart.js';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { ExpenseDto } from 'src/app/api/shopping/dtos/ExpenseDto';
import { BillContextService } from 'src/app/features/bill/services/bill-context.service';
import { getDialogBaseConfig } from 'src/app/shared/dialog/dialog-functions';
import { ChartDetailsDialogComponent } from '../chart-details-dialog/chart-details-dialog.component';
import { ChartDetailsDialogData } from '../chart-details-dialog/ChartDetailsDialogData';
import { TimeRange } from '../../../../../shared/models/TimeRange';

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

  // Summe der sichtbaren Kategorien, berechnet von ExpensesComponent; fuer Ringmitte und Legendenanteile
  @Input()
  sum: number = 0;

  // Namen der ausgeblendeten Kategorien (Zustand liegt in ExpensesComponent)
  @Input()
  hiddenCategories: string[] = [];

  @Output()
  visibilityToggled = new EventEmitter<string>();

  visibleExpenses: ExpenseDto[] = [];

  //CHART DATA
  chartLabels: string[] = [];
  chartData: number[] = [];
  chartDatasets: { data: number[]; backgroundColor: string[] }[] = [
    {
      data: [],
      backgroundColor: []
    }
  ];
  // Ringdiagramm (umsetzung.md, Statistik): Luecken zwischen den Segmenten in der Hintergrundfarbe (Token --bg zur Laufzeit),
  // eigene Legende im Template statt der Chart.js-Legende
  chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '78%',
    elements: {
      arc: {
        borderWidth: 3,
        borderColor: ChartComponent.readBackgroundToken(),
        hoverBorderColor: ChartComponent.readBackgroundToken()
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

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
    if (changes?.['expenses'] || changes?.['hiddenCategories']) {
      this.refreshChart();
    }
  }

  // Index bezieht sich auf das Diagramm und damit auf die sichtbaren Kategorien
  public chartClicked(event: any): void {
    if (event.active.length > 0) {
      const expense = this.visibleExpenses[event.active[0].index];
      if (expense) {
        this.openDetails(expense);
      }
    }
  }

  openDetails(expense: ExpenseDto): void {
    const data: ChartDetailsDialogData = {
      expense: expense
    }

    const config = getDialogBaseConfig();
    config.data = data;

    this.matDialog.open(ChartDetailsDialogComponent, config).afterClosed().subscribe();
  }

  colorOf(expense: ExpenseDto): string {
    return expense.color || this.categories.find(c => c.name == expense.category)?.color || 'grey';
  }

  isHidden(expense: ExpenseDto): boolean {
    return this.hiddenCategories.includes(expense.category);
  }

  percentOf(expense: ExpenseDto): number | null {
    return this.isHidden(expense) || !this.sum ? null : expense.costs / this.sum * 100;
  }

  refreshChart() {
    this.visibleExpenses = this.expenses.filter(e => !this.isHidden(e));

    // neues Array zuweisen, damit ng2-charts neu zeichnet
    this.chartDatasets = [
      {
        data: this.visibleExpenses.map(e => e.costs),
        backgroundColor: this.visibleExpenses.map(e => this.colorOf(e))
      }
    ];

    this.chartLabels = this.visibleExpenses.map(e => e.category);
  }

  // Chart.js zeichnet auf Canvas und kennt keine CSS-Variablen: Wert des Tokens --bg zur Laufzeit lesen
  private static readBackgroundToken(): string {
    return getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  }
}
