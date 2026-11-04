import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { AmountKey } from '../logic/amount-input';

/**
 * Eigene Zifferntastatur des Schnell-Sheets (v2 „Zifferntastatur“, AC9): 1–9, Komma, 0, Löschen.
 * Die Tasten sind Buttons ohne Eingabefeld, daher erscheint keine Systemtastatur.
 */
@Component({
  selector: 'app-amount-keypad',
  templateUrl: './amount-keypad.component.html',
  styleUrls: ['./amount-keypad.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatIcon]
})
export class AmountKeypadComponent {
  @Output() readonly key = new EventEmitter<AmountKey>();

  readonly digits: AmountKey[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0'];
}
