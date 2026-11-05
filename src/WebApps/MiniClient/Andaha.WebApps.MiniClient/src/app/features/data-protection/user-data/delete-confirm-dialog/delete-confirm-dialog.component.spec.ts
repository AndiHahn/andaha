import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { DeleteConfirmDialogComponent } from './delete-confirm-dialog.component';

describe('DeleteConfirmDialogComponent', () => {
  let fixture: ComponentFixture<DeleteConfirmDialogComponent>;
  let host: HTMLElement;
  let close: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    close = vi.fn();

    await TestBed.configureTestingModule({
      imports: [DeleteConfirmDialogComponent],
      providers: [{ provide: MatDialogRef, useValue: { close } }]
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteConfirmDialogComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();
  });

  function type(value: string): void {
    const input = host.querySelector('input') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function confirmButton(): HTMLButtonElement {
    return host.querySelector('button.confirm') as HTMLButtonElement;
  }

  it('shows the question and the confirmation prompt', () => {
    expect(host.textContent).toContain('Wirklich alle Daten löschen?');
    expect(host.textContent).toContain('Zur Bestätigung LÖSCHEN eingeben');
  });

  it('final button enabled only after typing LÖSCHEN', () => {
    expect(confirmButton().disabled).toBe(true);

    type('LÖSCHE');
    expect(confirmButton().disabled).toBe(true);

    type('löschen');
    expect(confirmButton().disabled).toBe(true);

    type('LÖSCHEN');
    expect(confirmButton().disabled).toBe(false);

    type('LÖSCHEN ');
    expect(confirmButton().disabled).toBe(true);
  });

  it('closes with true only when confirmed', () => {
    type('x');
    confirmButton().click();
    expect(close).not.toHaveBeenCalled();

    type('LÖSCHEN');
    confirmButton().click();
    expect(close).toHaveBeenCalledWith(true);
  });

  it('cancel closes without result', () => {
    (host.querySelector('button.sec2') as HTMLButtonElement).click();

    expect(close).toHaveBeenCalledWith();
  });
});
