import { ChangeDetectionStrategy, Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CATEGORY_COLORS, isKnownCategoryColor } from '../functions/category-functions';

/**
 * Farbraster fuer Kategorien (Mockup 03 A). Wert ist Hex oder ein bisheriger CSS-Name;
 * ein Wert ausserhalb der Palette steht vorne als gestrichelter Punkt.
 */
@Component({
  selector: 'app-color-swatches',
  templateUrl: './color-swatches.component.html',
  styleUrls: ['./color-swatches.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ColorSwatchesComponent), multi: true }]
})
export class ColorSwatchesComponent implements ControlValueAccessor {
  readonly palette = CATEGORY_COLORS;
  readonly value = signal('');
  readonly disabled = signal(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  /** bisherige Farbe ausserhalb der Palette; bleibt waehlbar, auch nachdem eine andere Farbe gewaehlt wurde */
  readonly legacyColor = signal<string | null>(null);

  isSelected(color: string): boolean {
    return this.value().toLowerCase() === color.toLowerCase();
  }

  select(color: string): void {
    if (this.disabled()) {
      return;
    }
    this.value.set(color);
    this.onChange(color);
    this.onTouched();
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
    if (value && !isKnownCategoryColor(value)) {
      this.legacyColor.set(value);
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
