import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LineItemDraft } from '../../../functions/line-items';
import { LineItemsEditorComponent } from './line-items-editor.component';

@Component({
  imports: [ReactiveFormsModule, LineItemsEditorComponent],
  template: `<app-line-items-editor [formControl]="control" />`
})
class HostComponent {
  readonly control = new FormControl<LineItemDraft[]>([], { nonNullable: true });
}

describe('LineItemsEditorComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HTMLElement;
  let control: FormControl<LineItemDraft[]>;

  const items: LineItemDraft[] = [
    { description: 'Milch', quantity: 2, unitPrice: 1.49, totalPrice: 2.98 },
    { description: 'Pfand', quantity: null, unitPrice: null, totalPrice: -0.25 }
  ];

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.nativeElement;
    control = fixture.componentInstance.control;
    control.setValue(items.map(item => ({ ...item })));
    await settle();
  });

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const rows = () => Array.from(host.querySelectorAll<HTMLElement>('.edit-row'));
  const field = (row: HTMLElement, label: string) => row.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
  const button = (text: string) =>
    Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(b => b.textContent?.includes(text))!;

  async function type(input: HTMLInputElement, value: string): Promise<void> {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await settle();
  }

  it('shows each item as an editable row', () => {
    expect(rows().length).toBe(2);
    expect(field(rows()[0], 'Beschreibung').value).toBe('Milch');
    expect(field(rows()[0], 'Menge').value).toBe('2');
    expect(field(rows()[0], 'Gesamtpreis').value).toBe('2,98');
    expect(field(rows()[1], 'Menge').value).toBe('');
    expect(field(rows()[1], 'Gesamtpreis').value).toBe('-0,25');
  });

  it('remove without confirmation', async () => {
    rows()[0].querySelector<HTMLButtonElement>('button[aria-label="Position entfernen"]')!.click();
    await settle();

    expect(document.querySelector('mat-dialog-container')).toBeNull();
    expect(rows().length).toBe(1);
    expect(control.value).toEqual([items[1]]);
  });

  it('add row', async () => {
    button('Position hinzufügen').click();
    await settle();

    expect(rows().length).toBe(3);
    expect(document.activeElement).toBe(field(rows()[2], 'Beschreibung'));
    // leere Beschreibung: Pflichtfeld, das Formular ist ungültig
    expect(control.invalid).toBe(true);
    field(rows()[2], 'Beschreibung').dispatchEvent(new Event('blur'));
    await settle();
    expect(rows()[2].querySelector('.field-error')?.textContent?.trim()).toBe('Pflichtfeld');

    await type(field(rows()[2], 'Beschreibung'), '  Brot ');
    await type(field(rows()[2], 'Gesamtpreis'), '3,4');

    expect(control.valid).toBe(true);
    expect(control.value[2]).toEqual({ description: 'Brot', quantity: null, unitPrice: null, totalPrice: 3.4 });
  });

  // Backend: höchstens 200 Positionen (LineItemDataValidator)
  it('add button disabled at 200 rows', async () => {
    const many = (count: number): LineItemDraft[] =>
      Array.from({ length: count }, (_, i) => ({ description: `P${i}`, quantity: null, unitPrice: null, totalPrice: null }));
    control.setValue(many(199));
    await settle();
    expect(button('Position hinzufügen').disabled).toBe(false);

    button('Position hinzufügen').click();
    await settle();
    expect(rows().length).toBe(200);
    expect(button('Position hinzufügen').disabled).toBe(true);

    rows()[0].querySelector<HTMLButtonElement>('button[aria-label="Position entfernen"]')!.click();
    await settle();
    expect(button('Position hinzufügen').disabled).toBe(false);

    control.setValue(many(200));
    await settle();
    expect(button('Position hinzufügen').disabled).toBe(true);
  });

  it('quantity 0 invalid', async () => {
    await type(field(rows()[0], 'Menge'), '0');

    expect(control.invalid).toBe(true);
    expect(rows()[0].querySelector('.field-error')?.textContent?.trim()).toBe('Ungültiger Wert');

    for (const value of ['1,5', 'abc', '-1']) {
      await type(field(rows()[0], 'Menge'), value);
      expect(control.invalid).toBe(true);
    }

    await type(field(rows()[0], 'Menge'), '3');
    expect(control.valid).toBe(true);
    expect(rows()[0].querySelector('.field-error')).toBeNull();
    expect(control.value[0].quantity).toBe(3);
  });

  it('negative total allowed', async () => {
    await type(field(rows()[0], 'Gesamtpreis'), '-1,50');

    expect(control.valid).toBe(true);
    expect(control.value[0].totalPrice).toBe(-1.5);

    await type(field(rows()[0], 'Gesamtpreis'), '0');
    expect(control.value[0].totalPrice).toBe(0);

    await type(field(rows()[0], 'Gesamtpreis'), '1,2,3');
    expect(control.invalid).toBe(true);
    expect(rows()[0].querySelector('.field-error')?.textContent?.trim()).toBe('Ungültiger Wert');

    // ohne Gesamtpreis ist die Position gültig
    await type(field(rows()[0], 'Gesamtpreis'), '');
    expect(control.valid).toBe(true);
    expect(control.value[0].totalPrice).toBeNull();
  });

  it('changing total clears unit price', async () => {
    // nur die Beschreibung geändert: Einzelpreis bleibt
    await type(field(rows()[0], 'Beschreibung'), 'Vollmilch');
    expect(control.value[0]).toEqual({ description: 'Vollmilch', quantity: 2, unitPrice: 1.49, totalPrice: 2.98 });

    await type(field(rows()[0], 'Gesamtpreis'), '3,10');
    expect(control.value[0]).toEqual({ description: 'Vollmilch', quantity: 2, unitPrice: null, totalPrice: 3.1 });
  });

  it('changing quantity clears unit price', async () => {
    await type(field(rows()[0], 'Menge'), '3');

    expect(control.value[0]).toEqual({ description: 'Milch', quantity: 3, unitPrice: null, totalPrice: 2.98 });
  });

  it('keeps a total with more than two decimals while it is not touched', async () => {
    control.setValue([{ description: 'Käse', quantity: 1, unitPrice: 1.495, totalPrice: 1.495 }]);
    await settle();

    await type(field(rows()[0], 'Beschreibung'), 'Bergkäse');

    expect(control.value[0]).toEqual({ description: 'Bergkäse', quantity: 1, unitPrice: 1.495, totalPrice: 1.495 });
  });
});
