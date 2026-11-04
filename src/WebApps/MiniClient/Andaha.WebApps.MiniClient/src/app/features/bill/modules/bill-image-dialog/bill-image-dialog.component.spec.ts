import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { BillImageDialogComponent } from './bill-image-dialog.component';
import { BillImageDialogData } from './BillImageDialogData';

describe('BillImageDialogComponent', () => {
  let fixture: ComponentFixture<BillImageDialogComponent>;
  let host: HTMLElement;
  let close: ReturnType<typeof vi.fn>;
  let openSnackbar: ReturnType<typeof vi.spyOn>;

  async function setup(data: BillImageDialogData): Promise<void> {
    close = vi.fn();
    TestBed.configureTestingModule({
      imports: [BillImageDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close } }
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

  it('mit delete (Rechnung): „Löschen“ löscht und schließt mit true', async () => {
    const remove = vi.fn(() => of(undefined));
    await setup({ image: jpeg(), delete: remove });

    Array.from(host.querySelectorAll('button')).find(b => b.textContent?.includes('Löschen'))!.click();

    expect(remove).toHaveBeenCalled();
    expect(close).toHaveBeenCalledWith(true);
  });

  it('leeres Foto: Fehlermeldung statt kaputtem Bild', async () => {
    await setup({ image: of(new Blob([], { type: 'image/png' })) });

    expect(host.querySelector('img')).toBeNull();
    expect(openSnackbar).toHaveBeenCalled();
  });
});
