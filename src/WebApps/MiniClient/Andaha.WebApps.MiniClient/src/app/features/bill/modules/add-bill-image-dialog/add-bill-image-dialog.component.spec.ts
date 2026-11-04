import type { MockedObject } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { AddBillImageDialogComponent } from './add-bill-image-dialog.component';
import { AddBillImageDialogModule } from './add-bill-image-dialog.module';

async function createJpegFile(width: number, height: number): Promise<File> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')!.fillRect(0, 0, width, height);
    const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/jpeg'));
    return new File([blob], 'rechnung.jpg', { type: 'image/jpeg' });
}

async function waitFor(condition: () => boolean, timeoutMs: number = 3000): Promise<void> {
    const start = Date.now();
    while (!condition() && Date.now() - start < timeoutMs) {
        await new Promise(resolve => setTimeout(resolve, 20));
    }
}

describe('AddBillImageDialogComponent', () => {
    let fixture: ComponentFixture<AddBillImageDialogComponent>;
    let dialogRef: MockedObject<MatDialogRef<AddBillImageDialogComponent>>;

    beforeEach(async () => {
        dialogRef = {
            close: vi.fn().mockName("MatDialogRef.close")
        } as unknown as MockedObject<MatDialogRef<AddBillImageDialogComponent, any>>;

        await TestBed.configureTestingModule({
            imports: [AddBillImageDialogModule],
            providers: [{ provide: MatDialogRef, useValue: dialogRef }]
        }).compileComponents();

        fixture = TestBed.createComponent(AddBillImageDialogComponent);
        fixture.detectChanges();
    });

    it('Kamera-Option oeffnet Datei-Input mit capture', () => {
        const input = fixture.nativeElement.querySelector('input[type=file][accept="image/*"][capture="environment"]');

        expect(input).not.toBeNull();
    });

    it('gewaehltes Bild wird verkleinert uebernommen und beim Uebernehmen zurueckgegeben', async () => {
        const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type=file][capture="environment"]');
        const transfer = new DataTransfer();
        transfer.items.add(await createJpegFile(3000, 1500));
        input.files = transfer.files;

        input.dispatchEvent(new Event('change'));
        await waitFor(() => !!fixture.componentInstance.image);
        fixture.detectChanges();

        expect(fixture.componentInstance.image).toBeDefined();
        const bitmap = await createImageBitmap(fixture.componentInstance.image!.file);
        expect(Math.max(bitmap.width, bitmap.height)).toBeLessThanOrEqual(2000);

        const confirm: HTMLButtonElement = fixture.nativeElement.querySelector('.actions button.pri');
        confirm.click();

        expect(dialogRef.close).toHaveBeenCalledWith(fixture.componentInstance.image);
    });
});
