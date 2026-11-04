import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject, viewChild } from '@angular/core';
import { formatDate } from '@angular/common';
import { DateAdapter } from '@angular/material/core';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatDatepicker, MatDatepickerInput, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MenuBackDirective } from 'src/app/core/overlay/menu-back.directive';
import { GERMAN_DATE_PROVIDERS } from 'src/app/shared/date-picker/german-date-providers';
import { toDayKey } from '../logic/quick-entry-state';

/**
 * Datumszeile des Schnell-Sheets (v2, AC14/AC15): „Heute, 03.11.2026“ mit Menü Heute · Gestern ·
 * Datum wählen (Datepicker), rechts „Alle Felder“.
 */
@Component({
  selector: 'app-quick-date-row',
  templateUrl: './quick-date-row.component.html',
  styleUrls: ['./quick-date-row.component.scss'],
  providers: GERMAN_DATE_PROVIDERS,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatIcon, MatMenu, MatMenuItem, MatMenuTrigger, MenuBackDirective, MatDatepicker, MatDatepickerInput]
})
export class QuickDateRowComponent {
  @Input({ required: true }) date!: Date;
  /** Datepicker als Dialog (mobil) statt Popup */
  @Input() touchUi = false;

  @Output() readonly dateChange = new EventEmitter<Date>();
  @Output() readonly allFields = new EventEmitter<void>();

  readonly today = new Date();

  private readonly dateAdapter = inject<DateAdapter<unknown>>(DateAdapter);
  private readonly picker = viewChild.required<MatDatepicker<unknown>>('picker');

  get label(): string {
    const key = toDayKey(this.date);
    const day = formatDate(this.date, 'dd.MM.yyyy', 'de');
    if (key === toDayKey(new Date())) {
      return `Heute, ${day}`;
    }
    if (key === toDayKey(this.yesterday())) {
      return `Gestern, ${day}`;
    }
    return formatDate(this.date, 'EE, dd.MM.yyyy', 'de');
  }

  setToday(): void {
    this.dateChange.emit(new Date());
  }

  setYesterday(): void {
    this.dateChange.emit(this.yesterday());
  }

  pickDate(): void {
    this.picker().open();
  }

  onPicked(event: MatDatepickerInputEvent<unknown>): void {
    const value = event.value;
    if (value && this.dateAdapter.isValid(value)) {
      this.dateChange.emit(new Date(this.dateAdapter.getYear(value), this.dateAdapter.getMonth(value), this.dateAdapter.getDate(value)));
    }
  }

  private yesterday(): Date {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date;
  }
}
