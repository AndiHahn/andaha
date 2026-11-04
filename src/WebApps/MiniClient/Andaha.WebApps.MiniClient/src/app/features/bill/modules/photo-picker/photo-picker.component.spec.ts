import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorSnackbarComponent } from 'src/app/shared/snackbar/error-snackbar/error-snackbar.component';
import { PhotoPickerComponent } from './photo-picker.component';

async function png(width: number, height: number): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.fillRect(0, 0, width, height);
  const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png'));
  return new File([blob], 'photo.png', { type: 'image/png' });
}

describe('PhotoPickerComponent', () => {
  let fixture: ComponentFixture<PhotoPickerComponent>;
  let host: HTMLElement;
  let selected: File[];

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PhotoPickerComponent] });
    fixture = TestBed.createComponent(PhotoPickerComponent);
    host = fixture.nativeElement;
    selected = [];
    fixture.componentInstance.photoSelected.subscribe(file => selected.push(file));
    fixture.detectChanges();
  });

  function button(text: string): HTMLButtonElement {
    return Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(b => b.textContent!.includes(text))!;
  }

  function choose(input: HTMLInputElement, file: File): void {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event('change'));
  }

  it('offers camera and gallery as native file inputs', () => {
    const camera = host.querySelector<HTMLInputElement>('input[capture]')!;
    const gallery = host.querySelector<HTMLInputElement>('input[type="file"]:not([capture])')!;

    expect(button('Kamera')).toBeTruthy();
    expect(button('Galerie')).toBeTruthy();
    expect(camera.type).toBe('file');
    expect(camera.accept).toBe('image/*');
    expect(camera.getAttribute('capture')).toBe('environment');
    expect(gallery.accept).toBe('image/*');

    const click = vi.spyOn(gallery, 'click');
    button('Galerie').click();
    expect(click).toHaveBeenCalled();
  });

  it('emits the downscaled jpeg and shows a loading state meanwhile', async () => {
    const gallery = host.querySelector<HTMLInputElement>('input[type="file"]:not([capture])')!;

    choose(gallery, await png(3000, 1500));
    fixture.detectChanges();

    expect(button('Kamera').disabled).toBe(true);
    expect(button('Galerie').disabled).toBe(true);
    expect(host.textContent).toContain('Wird verkleinert …');

    await vi.waitFor(() => expect(selected.length).toBe(1));
    fixture.detectChanges();

    expect(selected[0].type).toBe('image/jpeg');
    const bitmap = await createImageBitmap(selected[0]);
    expect(Math.max(bitmap.width, bitmap.height)).toBe(1600);
    bitmap.close();
    expect(button('Galerie').disabled).toBe(false);
    expect(gallery.value).toBe('');
  });

  it('rejects files that cannot be read as image', async () => {
    const open = vi.spyOn(TestBed.inject(MatSnackBar), 'openFromComponent');
    const gallery = host.querySelector<HTMLInputElement>('input[type="file"]:not([capture])')!;

    choose(gallery, new File(['kein bild'], 'notiz.txt', { type: 'text/plain' }));

    await vi.waitFor(() => expect(open).toHaveBeenCalled());
    expect(open).toHaveBeenCalledWith(ErrorSnackbarComponent, expect.objectContaining({ data: 'Das Foto konnte nicht gelesen werden.' }));
    expect(selected).toEqual([]);
  });

  it('shows the chosen photo and can remove it', async () => {
    const removed = vi.fn();
    fixture.componentInstance.photoRemoved.subscribe(removed);
    fixture.componentRef.setInput('photo', await png(20, 10));
    fixture.detectChanges();

    expect(host.querySelector('img')!.getAttribute('src')).toMatch(/^blob:/);
    host.querySelector<HTMLButtonElement>('button[aria-label="Foto entfernen"]')!.click();
    expect(removed).toHaveBeenCalled();
  });

  it('is disabled on request', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    expect(button('Kamera').disabled).toBe(true);
    expect(button('Galerie').disabled).toBe(true);
  });
});
