import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, viewChild } from '@angular/core';

/**
 * Betrag im Schnell-Sheet (v2): mobil eine große Anzeige (44/600) mit Cursor, ein Tipp öffnet die
 * Zifferntastatur; im Desktop-Dialog ein großes Eingabefeld mit `inputmode="decimal"`.
 */
@Component({
  selector: 'app-quick-amount',
  templateUrl: './quick-amount.component.html',
  styleUrls: ['./quick-amount.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager
})
export class QuickAmountComponent {
  /** `input`: Desktop-Eingabefeld, `keypad`: Anzeige zur eigenen Zifferntastatur */
  @Input() mode: 'keypad' | 'input' = 'keypad';
  /** eingegebener Text (Eingabefeld) */
  @Input() text = '';
  /** angezeigter Betrag (Anzeige), leer = Platzhalter */
  @Input() display = '';
  @Input() keypadOpen = false;

  @Output() readonly openKeypad = new EventEmitter<void>();
  @Output() readonly textChange = new EventEmitter<string>();
  @Output() readonly submitted = new EventEmitter<void>();

  private readonly amountInput = viewChild<ElementRef<HTMLInputElement>>('amountInput');

  onInput(event: Event): void {
    this.textChange.emit((event.target as HTMLInputElement).value);
  }

  /** Fokus ins Eingabefeld (Desktop); mit Zifferntastatur ohne Wirkung */
  focusInput(): void {
    this.amountInput()?.nativeElement.focus();
  }
}
