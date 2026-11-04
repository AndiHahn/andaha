import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ScanOverlayComponent } from './scan-overlay.component';

describe('ScanOverlayComponent', () => {
  it('zeigt Foto, „Rechnung wird gelesen …“ und „Abbrechen“ schließt das Overlay', () => {
    const close = vi.fn();
    const revoke = vi.spyOn(URL, 'revokeObjectURL');
    TestBed.configureTestingModule({
      imports: [ScanOverlayComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { image: new File(['x'], 'image.jpg', { type: 'image/jpeg' }) } },
        { provide: MatDialogRef, useValue: { close } }
      ]
    });
    const fixture = TestBed.createComponent(ScanOverlayComponent);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;

    expect(host.querySelector('img')!.src.startsWith('blob:')).toBe(true);
    expect(host.querySelector('[role="status"]')!.textContent).toContain('Rechnung wird gelesen …');

    const cancel = host.querySelector<HTMLButtonElement>('button')!;
    expect(cancel.textContent).toContain('Abbrechen');
    cancel.click();
    expect(close).toHaveBeenCalled();

    fixture.destroy();
    expect(revoke).toHaveBeenCalled();
  });
});
