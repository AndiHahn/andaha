import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MATERIAL_ANIMATIONS, MatOption, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepicker, MatDatepickerInput } from '@angular/material/datepicker';
import { MatSelect } from '@angular/material/select';
import { OverlayBackService } from './overlay-back.service';
import { PanelBackDirective } from './panel-back.directive';

@Component({
  template: `
    <input [matDatepicker]="picker">
    <mat-datepicker #picker [touchUi]="true" />

    <mat-select aria-label="Kategorie">
      <mat-option value="a">A</mat-option>
      <mat-option value="b">B</mat-option>
    </mat-select>

    <input class="shop" [matAutocomplete]="auto">
    <mat-autocomplete #auto="matAutocomplete">
      <mat-option value="Billa">Billa</mat-option>
    </mat-autocomplete>
  `,
  imports: [MatDatepicker, MatDatepickerInput, MatSelect, MatOption, MatAutocomplete, MatAutocompleteTrigger, PanelBackDirective]
})
class HostComponent {
  readonly picker = viewChild.required(MatDatepicker);
  readonly select = viewChild.required(MatSelect);
  readonly trigger = viewChild.required(MatAutocompleteTrigger);
}

describe('PanelBackDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let register: ReturnType<typeof vi.fn>;
  let release: ReturnType<typeof vi.fn>;

  /** zuletzt angemeldete Schließen-Funktion, wie sie der OverlayBackService bei Zurück aufruft */
  function back(): void {
    const close = register.mock.calls.at(-1)![0] as () => void;
    close();
  }

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    release = vi.fn();
    register = vi.fn(() => release);
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        provideNativeDateAdapter(),
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
        { provide: OverlayBackService, useValue: { register } }
      ]
    });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    await settle();
  });

  it('registers an open datepicker and closes only the picker on back', async () => {
    host.picker().open();
    await settle();
    expect(register).toHaveBeenCalledTimes(1);

    back();
    await settle();

    expect(host.picker().opened).toBe(false);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('releases the datepicker entry when it closes another way', async () => {
    host.picker().open();
    await settle();

    host.picker().close();
    await settle();

    expect(release).toHaveBeenCalledTimes(1);
    expect(register).toHaveBeenCalledTimes(1);
  });

  it('registers an open select panel and closes it on back', async () => {
    host.select().open();
    await settle();
    expect(register).toHaveBeenCalledTimes(1);

    back();
    await settle();

    expect(host.select().panelOpen).toBe(false);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('releases the select entry when an option is chosen', async () => {
    host.select().open();
    await settle();

    document.querySelector<HTMLElement>('mat-option')!.click();
    await settle();

    expect(host.select().value).toBe('a');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('registers an open autocomplete panel and closes it on back', async () => {
    const input = fixture.nativeElement.querySelector('input.shop') as HTMLInputElement;
    input.focus();
    input.dispatchEvent(new Event('focusin'));
    await settle();
    expect(host.trigger().panelOpen).toBe(true);
    expect(register).toHaveBeenCalledTimes(1);

    back();
    await settle();

    expect(host.trigger().panelOpen).toBe(false);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('releases an open panel when the view is destroyed', async () => {
    host.select().open();
    await settle();

    fixture.destroy();

    expect(release).toHaveBeenCalled();
  });
});
