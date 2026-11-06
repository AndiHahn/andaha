import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, Injector, afterNextRender, forwardRef, inject, viewChildren } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl, ControlValueAccessor, FormArray, FormControl, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR,
  ReactiveFormsModule, ValidationErrors, Validator, ValidatorFn
} from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ShowErrorPipe } from 'src/app/shared/form-field/show-error.pipe';
import { LineItemDraft, MAX_LINE_ITEM_DESCRIPTION, parseLineItemPrice, parseLineItemQuantity } from '../../../functions/line-items';
import { formatAmount } from '../../../quick-entry/logic/amount-input';

interface LineItemRowForm {
  description: FormControl<string>;
  quantity: FormControl<string>;
  totalPrice: FormControl<string>;
}

/** Stand einer Position beim Öffnen: solange Menge und Gesamtpreis unverändert sind, bleibt der Einzelpreis */
interface RowOrigin {
  quantityText: string;
  totalText: string;
  draft: LineItemDraft;
}

const requiredText: ValidatorFn = control => (control.value as string).trim() === '' ? { required: true } : null;
const validQuantity: ValidatorFn = control => parseLineItemQuantity(control.value as string) === undefined ? { invalid: true } : null;
const validPrice: ValidatorFn = control => parseLineItemPrice(control.value as string) === undefined ? { invalid: true } : null;

/**
 * Positionen bearbeiten (design.md §5.4): Beschreibung (Pflicht), Menge (ganze Zahl ≥ 1), Gesamtpreis
 * (Komma, auch negativ) und Entfernen ohne Rückfrage. Der Einzelpreis wird nicht angezeigt und fällt weg,
 * sobald sich Menge oder Gesamtpreis ändern. Wert: `LineItemDraft[]`, ungültig solange eine Zeile es ist.
 */
@Component({
  selector: 'app-line-items-editor',
  templateUrl: './line-items-editor.component.html',
  styleUrls: ['./line-items-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatIcon, ShowErrorPipe],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => LineItemsEditorComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => LineItemsEditorComponent), multi: true }
  ]
})
export class LineItemsEditorComponent implements ControlValueAccessor, Validator {
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly injector = inject(Injector);

  protected readonly maxDescription = MAX_LINE_ITEM_DESCRIPTION;
  protected readonly rows = new FormArray<FormGroup<LineItemRowForm>>([]);
  /** parallel zu `rows`; `null` für neu hinzugefügte Zeilen */
  private origins: (RowOrigin | null)[] = [];

  private readonly descriptionInputs = viewChildren<ElementRef<HTMLInputElement>>('descriptionInput');

  private onChange: (value: LineItemDraft[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    this.rows.valueChanges.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => this.onChange(this.drafts()));
  }

  writeValue(value: LineItemDraft[] | null): void {
    this.rows.clear({ emitEvent: false });
    this.origins = [];
    for (const draft of value ?? []) {
      const origin: RowOrigin = {
        quantityText: draft.quantity == null ? '' : String(draft.quantity),
        totalText: draft.totalPrice == null ? '' : formatAmount(draft.totalPrice),
        draft
      };
      this.rows.push(this.createRow(draft.description, origin.quantityText, origin.totalText), { emitEvent: false });
      this.origins.push(origin);
    }
    this.changeDetector.markForCheck();
  }

  registerOnChange(fn: (value: LineItemDraft[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.rows.disable({ emitEvent: false });
    } else {
      this.rows.enable({ emitEvent: false });
    }
    this.changeDetector.markForCheck();
  }

  validate(_: AbstractControl): ValidationErrors | null {
    return this.rows.invalid ? { lineItems: true } : null;
  }

  /** Zeigt die Feldfehler aller Zeilen, z. B. nach einem Speicherversuch */
  markAllAsTouched(): void {
    this.rows.markAllAsTouched();
    this.changeDetector.markForCheck();
  }

  protected add(): void {
    this.origins.push(null);
    this.rows.push(this.createRow('', '', ''));
    afterNextRender(() => this.descriptionInputs().at(-1)?.nativeElement.focus(), { injector: this.injector });
  }

  /** Ohne Rückfrage (design.md §5.4): wirksam erst beim Speichern, „Abbrechen“ stellt wieder her */
  protected remove(index: number): void {
    this.origins.splice(index, 1);
    this.rows.removeAt(index);
  }

  protected touched(): void {
    this.onTouched();
  }

  private createRow(description: string, quantity: string, totalPrice: string): FormGroup<LineItemRowForm> {
    return new FormGroup<LineItemRowForm>({
      description: new FormControl(description, { nonNullable: true, validators: requiredText }),
      quantity: new FormControl(quantity, { nonNullable: true, validators: validQuantity }),
      totalPrice: new FormControl(totalPrice, { nonNullable: true, validators: validPrice })
    });
  }

  private drafts(): LineItemDraft[] {
    return this.rows.getRawValue().map((row, index) => {
      const origin = this.origins[index];
      const quantityKept = origin !== null && row.quantity === origin.quantityText;
      const totalKept = origin !== null && row.totalPrice === origin.totalText;
      return {
        description: row.description.trim(),
        quantity: quantityKept ? origin.draft.quantity : parseLineItemQuantity(row.quantity) ?? null,
        unitPrice: quantityKept && totalKept ? origin.draft.unitPrice : null,
        // unverändert: der gespeicherte Wert, auch mit mehr als zwei Nachkommastellen
        totalPrice: totalKept ? origin.draft.totalPrice : parseLineItemPrice(row.totalPrice) ?? null
      };
    });
  }
}
