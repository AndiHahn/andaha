import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatOption } from '@angular/material/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSelect } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import moment from 'moment';
import { map } from 'rxjs';
import { PersonApiService } from 'src/app/api/work/person-api.service';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { DatePickerFormFieldComponent } from 'src/app/shared/date-picker/date-picker-form-field/date-picker-form-field.component';
import { LoadState, LoadStateComponent } from 'src/app/shared/load-state/load-state.component';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { XLSX_MIME_TYPE, canShareFiles, getFileName, shareOrDownload } from 'src/app/shared/utils/file-utils';
import { mapTimeRangeDto } from 'src/app/shared/models/TimeRange';
import { ExpenseContextService } from '../bill/services/expense-context.service';
import { ExportRangePreset, exportRangePreset } from './export-range';

const EXPORT_FAILED = 'Export fehlgeschlagen. Bitte erneut versuchen.';

@Component({
  selector: 'app-export',
  templateUrl: './export.component.html',
  styleUrls: ['./export.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ReactiveFormsModule, MatIcon, MatOption, MatProgressSpinner, MatSelect, DatePickerFormFieldComponent, LoadStateComponent]
})
export class ExportComponent {
  private expenseContextService = inject(ExpenseContextService);
  private personApiService = inject(PersonApiService);
  private categoryContextService = inject(BillCategoryContextService);
  private snackbar = inject(MatSnackBar);

  readonly presets: { value: ExportRangePreset; label: string }[] = [
    { value: 'this-month', label: 'Dieser Monat' },
    { value: 'this-year', label: 'Dieses Jahr' },
    { value: 'last-year', label: 'Letztes Jahr' },
    { value: 'all', label: 'Alles' }
  ];

  readonly availableRange = toSignal(this.expenseContextService.availableTimeRange()
    .pipe(map(range => range ? mapTimeRangeDto(range) : undefined)));
  readonly categoryNames = toSignal(this.categoryContextService.categories()
    .pipe(map(categories => [...new Set(categories.map(category => category.name))])), { initialValue: [] as string[] });

  /** Gewählte Schnellwahl; null, sobald Von/Bis von Hand geändert wurden */
  readonly preset = signal<ExportRangePreset | null>('this-year');
  readonly exporting = signal<'expenses' | 'work' | null>(null);

  readonly fromControl = new FormControl<unknown>(null);
  readonly toControl = new FormControl<unknown>(null);
  readonly categoryControl = new FormControl<string[]>([], { nonNullable: true });

  /** „teilen“, wo der Browser Dateien teilen kann, sonst „herunterladen“ */
  readonly shareVerb = canShareFiles('export.xlsx', XLSX_MIME_TYPE) ? 'teilen' : 'herunterladen';
  readonly actionIcon = this.shareVerb === 'teilen' ? 'ios_share' : 'download';

  readonly categoriesState = computed<LoadState>(() => {
    if (this.categoryContextService.error()) {
      return 'error';
    }
    return this.categoryContextService.loading() && this.categoryNames().length === 0 ? 'loading' : 'ready';
  });

  constructor() {
    this.applyPreset('this-year');
    this.fromControl.valueChanges.subscribe(() => this.preset.set(null));
    this.toControl.valueChanges.subscribe(() => this.preset.set(null));
  }

  selectPreset(preset: ExportRangePreset): void {
    this.applyPreset(preset);
    this.preset.set(preset);
  }

  /** Von und Bis als Datum, oder undefined, solange eines fehlt, ungültig ist oder Von nach Bis liegt */
  selectedRange(): { start: Date; end: Date } | undefined {
    const start = this.toDate(this.fromControl.value);
    const end = this.toDate(this.toControl.value);
    return start && end && start <= end ? { start, end } : undefined;
  }

  rangeIsReversed(): boolean {
    const start = this.toDate(this.fromControl.value);
    const end = this.toDate(this.toControl.value);
    return !!start && !!end && start > end;
  }

  retryCategories(): void {
    this.categoryContextService.retry();
  }

  onExportExpensesClick(): void {
    const range = this.selectedRange();
    if (!range || this.exporting()) {
      return;
    }

    this.exporting.set('expenses');
    this.expenseContextService.downloadExpenses(range.start, range.end, this.categoryControl.value).subscribe({
      next: () => this.exporting.set(null),
      error: () => this.fail()
    });
  }

  onExportWorkInformationClick(): void {
    if (this.exporting()) {
      return;
    }

    this.exporting.set('work');
    this.personApiService.export().subscribe({
      next: response => {
        if (!response.body) {
          this.fail();
          return;
        }
        shareOrDownload(response.body, getFileName(response.headers), XLSX_MIME_TYPE)
          .then(() => this.exporting.set(null), () => this.fail());
      },
      error: () => this.fail()
    });
  }

  private fail(): void {
    this.exporting.set(null);
    openErrorSnackbar(EXPORT_FAILED, this.snackbar);
  }

  private applyPreset(preset: ExportRangePreset): void {
    const available = this.availableRange();
    const range = exportRangePreset(preset, new Date(), available ?? { startDate: new Date(), endDate: new Date() });
    this.fromControl.setValue(range.start, { emitEvent: false });
    this.toControl.setValue(range.end, { emitEvent: false });
  }

  private toDate(value: unknown): Date | undefined {
    if (!value) {
      return undefined;
    }
    const parsed = moment(value as moment.MomentInput);
    return parsed.isValid() ? parsed.startOf('day').toDate() : undefined;
  }
}
