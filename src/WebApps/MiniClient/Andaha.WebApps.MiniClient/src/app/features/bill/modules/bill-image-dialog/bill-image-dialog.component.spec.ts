import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { BillImageDialogComponent } from './bill-image-dialog.component';
import { BillImageDialogData } from './BillImageDialogData';

import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';

describe('BillImageDialogComponent', () => {
  let fixture: ComponentFixture<BillImageDialogComponent>;
  let host: HTMLElement;
  let close: ReturnType<typeof vi.fn>;
  let openSnackbar: ReturnType<typeof vi.spyOn>;
  let openConfirmation: ReturnType<typeof vi.fn>;
  let confirmed: boolean;

  async function setup(data: BillImageDialogData): Promise<void> {
    close = vi.fn();
    confirmed = true;
    openConfirmation = vi.fn(() => Promise.resolve({ afterClosed: () => of(confirmed) }));
    TestBed.configureTestingModule({
      imports: [BillImageDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close } },
        { provide: ConfirmationDialogService, useValue: { openDialog: openConfirmation } }
      ]
    });
    openSnackbar = vi.spyOn(TestBed.inject(MatSnackBar), 'openFromComponent').mockReturnValue(undefined as never);
    fixture = TestBed.createComponent(BillImageDialogComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.isLoading).toBe(false));
    fixture.detectChanges();
  }

  const jpeg = () => of(new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: 'image/jpeg' }));

  it('zeigt das geladene Foto im Pinch-Zoom', async () => {
    await setup({ image: jpeg() });

    const img = host.querySelector<HTMLImageElement>('pinch-zoom img');
    expect(img?.src.startsWith('data:image/jpeg')).toBe(true);
  });

  it('ohne delete (Analyse): kein „Löschen“', async () => {
    await setup({ image: jpeg() });

    expect(host.textContent).not.toContain('Löschen');
  });

  it('mit delete (Rechnung): „Löschen“ löscht nach der Rückfrage, vibriert und schließt mit true', async () => {
    const remove = vi.fn(() => of(undefined));
    const vibrate = vi.spyOn(navigator, 'vibrate').mockImplementation(() => true);
    await setup({ image: jpeg(), delete: remove });

    Array.from(host.querySelectorAll('button')).find(b => b.textContent?.includes('Löschen'))!.click();
    await vi.waitFor(() => expect(close).toHaveBeenCalledWith(true));

    expect(remove).toHaveBeenCalled();
    expect(vibrate).toHaveBeenCalledWith(30);
    vibrate.mockRestore();
  });

  it('delete photo asks confirmation', async () => {
    const remove = vi.fn(() => of(undefined));
    await setup({ image: jpeg(), delete: remove });
    confirmed = false;

    Array.from(host.querySelectorAll('button')).find(b => b.textContent?.includes('Löschen'))!.click();
    await vi.waitFor(() => expect(openConfirmation).toHaveBeenCalledTimes(1));
    await Promise.resolve();

    expect(openConfirmation.mock.calls[0][0].text).toContain('Foto');
    expect(remove).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });

  it('leeres Foto: Fehlermeldung statt kaputtem Bild', async () => {
    await setup({ image: of(new Blob([], { type: 'image/png' })) });

    expect(host.querySelector('img')).toBeNull();
    expect(openSnackbar).toHaveBeenCalled();
  });
});
