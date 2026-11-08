import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { confidencePercent } from '../../functions/analyzed-bill-functions';

/** Warnschwellen als Anteil; verglichen wird der Rohwert wie in den Backend-Regeln, angezeigt der gerundete Prozentwert (design.md §3) */
export const CONFIDENCE_THRESHOLDS = { shop: 0.75, date: 0.8, amount: 0.9, document: 0.75 } as const;

interface ConfidenceRow {
  key: string;
  label: string;
  percent: number | null;
  warn: boolean;
  hint?: string;
}

/**
 * Die vier Erkennungs-Konfidenzen (Shop, Datum, Betrag, Dokument) als Zeilen mit Balken.
 * Fehlende Werte zeigen „–“; unter der Schwelle bekommt die Zeile die Klasse `warn`.
 */
@Component({
  selector: 'app-confidence-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="conf-list">
      @for (row of rows(); track row.key) {
        <li class="conf-row" [class.warn]="row.warn" [attr.data-row]="row.key">
          <span class="conf-label">{{ row.label }}</span>
          <span class="conf-value">
            @if (row.hint) {
              <span class="conf-hint">{{ row.hint }}</span>
            }
            @if (row.percent !== null) {
              <span class="conf-bar" aria-hidden="true"><span class="conf-fill" [style.width.%]="row.percent"></span></span>
              <span class="conf-pct">{{ row.percent }} %</span>
            } @else {
              <span class="conf-pct">–</span>
            }
          </span>
        </li>
      }
    </ul>
  `,
  styles: `
    .conf-list { margin: 0; padding: 0; list-style: none; }
    .conf-row {
      display: flex; justify-content: space-between; align-items: baseline; gap: 16px;
      padding: 10px 16px; border-bottom: 1px solid var(--line2); font-size: 15px;
    }
    .conf-label { color: var(--mut); }
    .conf-value { display: inline-flex; align-items: center; gap: 8px; font-weight: 500; }
    .conf-hint { font-size: 13px; font-weight: 400; color: var(--mut); }
    .conf-bar { width: 72px; height: 6px; border-radius: 3px; background: var(--line-sheet); overflow: hidden; }
    .conf-fill { display: block; max-width: 100%; height: 100%; background: var(--pos); }
    .warn .conf-fill { background: var(--sec); }
    .warn .conf-pct { color: var(--sec-text); }
    @media (min-width: 1024px) { .conf-row { padding-left: 0; padding-right: 0; } }
  `
})
export class ConfidenceListComponent {
  readonly shop = input<number | null | undefined>();
  readonly date = input<number | null | undefined>();
  readonly amount = input<number | null | undefined>();
  readonly document = input<number | null | undefined>();
  /** Rohtext des Betrags, wird als „erkannt: …“ an der Betragszeile gezeigt */
  readonly amountText = input<string | null | undefined>();

  protected readonly rows = computed<ConfidenceRow[]>(() => [
    this.row('shop', 'Shop', this.shop(), CONFIDENCE_THRESHOLDS.shop),
    this.row('date', 'Datum', this.date(), CONFIDENCE_THRESHOLDS.date),
    { ...this.row('amount', 'Betrag', this.amount(), CONFIDENCE_THRESHOLDS.amount),
      hint: this.amountText() ? `erkannt: ${this.amountText()}` : undefined },
    this.row('document', 'Dokument', this.document(), CONFIDENCE_THRESHOLDS.document)
  ]);

  private row(key: string, label: string, value: number | null | undefined, threshold: number): ConfidenceRow {
    const percent = confidencePercent(value);
    return { key, label, percent, warn: percent !== null && (value as number) < threshold };
  }
}
