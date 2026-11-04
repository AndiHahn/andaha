import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayBackService } from 'src/app/core/overlay/overlay-back.service';
import { QuickDateRowComponent } from './quick-date-row.component';

/**
 * Wie im großen Formular: die Zeile steht in einem `.field .field-box`, dessen globale Regel
 * (`.field .field-box input { all: unset; … }`, styles.scss) jedes Input darin zurücksetzt.
 */
@Component({
  template: `
    <style>.field .field-box input { all: unset; flex: 1; min-width: 0; font-size: 16px; }</style>
    <div class="field"><span class="field-box">
      <app-quick-date-row [date]="date" [showAllFields]="false" />
    </span></div>`,
  imports: [QuickDateRowComponent]
})
class FieldHostComponent {
  date = new Date();
}

describe('QuickDateRowComponent', () => {
  let fixture: ComponentFixture<FieldHostComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [FieldHostComponent],
      providers: [{ provide: OverlayBackService, useValue: { register: () => () => undefined } }]
    });
    fixture = TestBed.createComponent(FieldHostComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('keeps the datepicker anchor invisible, also inside a form field', () => {
    const anchor = host.querySelector<HTMLInputElement>('input.picker-anchor')!;
    const style = getComputedStyle(anchor);
    const rect = anchor.getBoundingClientRect();

    expect(anchor).toBeTruthy();
    expect(style.position).toBe('absolute');
    expect(style.opacity).toBe('0');
    expect(rect.width).toBeLessThanOrEqual(1);
    expect(rect.height).toBeLessThanOrEqual(1);
  });

  it('opens the datepicker popup at the row', async () => {
    const row = fixture.debugElement.query(el => el.componentInstance instanceof QuickDateRowComponent);
    (row.componentInstance as QuickDateRowComponent).pickDate();
    fixture.detectChanges();
    await fixture.whenStable();

    const popup = document.querySelector<HTMLElement>('.mat-datepicker-content')!;
    const anchor = host.querySelector<HTMLElement>('input.picker-anchor')!.getBoundingClientRect();
    const pane = popup.closest('.cdk-overlay-pane')!.getBoundingClientRect();

    expect(popup).toBeTruthy();
    // Popup hängt am Anker (darunter oder, wenn kein Platz, darüber), horizontal ab dessen linker Kante
    expect(Math.min(Math.abs(pane.top - anchor.bottom), Math.abs(pane.bottom - anchor.top))).toBeLessThanOrEqual(2);
    expect(Math.abs(pane.left - anchor.left)).toBeLessThanOrEqual(2);
  });

  it('shows the date only once and hides „Alle Felder“ on request', () => {
    const text = host.textContent!.replace(/\s+/g, ' ');
    const day = new Date().toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });

    expect(text.split(day).length - 1).toBe(1);
    expect(text).not.toContain('Alle Felder');
  });
});
