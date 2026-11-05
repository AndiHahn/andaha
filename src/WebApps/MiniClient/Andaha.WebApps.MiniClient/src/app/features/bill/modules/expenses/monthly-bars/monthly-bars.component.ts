import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatDate } from '@angular/common';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { MonthlyCostsDto } from 'src/app/api/shopping/dtos/MonthlyCostsDto';

/**
 * Balken der Ausgaben je Monat (design.md 3.2, Mockup 01 B). Monate, die mit `highlight` beginnen
 * ("YYYY-MM" für einen Monat, "YYYY" für ein Jahr), stehen in Primärfarbe, die übrigen neutral.
 */
@Component({
  selector: 'app-monthly-bars',
  template: `
    <div class="bars">
      <div class="canvas-box">
        <canvas baseChart role="img" [attr.aria-label]="ariaLabel()"
          [type]="'bar'" [data]="chartData()" [options]="chartOptions"></canvas>
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }

    /* Mockup 01 B: Balken 96px hoch, darunter die Monatsbuchstaben, Rand 16px */
    .bars { padding: 10px 16px 6px; }
    .canvas-box { position: relative; height: 114px; }
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [BaseChartDirective],
  // ng2-charts 11: Chart.js-Registrierung per Provider, damit chart.js nur im Statistik-Chunk geladen wird
  providers: [provideCharts(withDefaultRegisterables())]
})
export class MonthlyBarsComponent {
  readonly months = input.required<MonthlyCostsDto[]>();
  readonly highlight = input<string>('');
  /** Beschreibung für Screenreader; `costs` trägt die Balkenwerte, bei Stunden also die Stunden */
  readonly ariaLabel = input<string>('Ausgaben je Monat');

  /** Anfangsbuchstabe des Monats, z. B. „N“ */
  readonly labels = computed(() => this.months().map(month => formatDate(monthStart(month.month), 'LLLLL', 'de')));

  readonly highlighted = computed(() => {
    const highlight = this.highlight();
    return this.months().map(month => highlight.length > 0 && month.month.startsWith(highlight));
  });

  // Chart.js zeichnet auf Canvas und kennt keine CSS-Variablen: Token-Werte zur Laufzeit lesen
  private readonly primaryColor = readToken('--pri');
  private readonly neutralColor = readToken('--line3');
  private readonly labelColor = readToken('--faint');

  readonly chartData = computed<ChartData<'bar'>>(() => ({
    labels: this.labels(),
    datasets: [
      {
        data: this.months().map(month => month.costs),
        backgroundColor: this.highlighted().map(on => on ? this.primaryColor : this.neutralColor),
        borderRadius: 4,
        categoryPercentage: 0.8,
        barPercentage: 1
      }
    ]
  }));

  readonly chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    events: [],
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          autoSkip: false,
          maxRotation: 0,
          padding: 4,
          color: context => this.highlighted()[context.index] ? this.primaryColor : this.labelColor,
          font: context => ({
            family: readFontFamily(),
            size: 10,
            weight: this.highlighted()[context.index] ? 600 : 400
          })
        }
      },
      y: {
        display: false,
        beginAtZero: true
      }
    }
  };
}

function monthStart(month: string): Date {
  const [year, monthIndex] = month.split('-').map(Number);
  return new Date(year, monthIndex - 1, 1);
}

function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function readFontFamily(): string {
  return getComputedStyle(document.body).fontFamily;
}
