import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuickEntryDockComponent } from './quick-entry-dock.component';

describe('QuickEntryDockComponent', () => {
  let fixture: ComponentFixture<QuickEntryDockComponent>;
  let host: HTMLElement;

  function setup(layout: 'mobile' | 'desktop'): void {
    TestBed.configureTestingModule({ imports: [QuickEntryDockComponent] });
    fixture = TestBed.createComponent(QuickEntryDockComponent);
    fixture.componentRef.setInput('layout', layout);
    fixture.detectChanges();
    host = fixture.nativeElement;
  }

  function fileInput(): HTMLInputElement {
    return host.querySelector<HTMLInputElement>('input[type="file"]')!;
  }

  it('mobil: Kamera-Knopf öffnet die native Kamera', () => {
    setup('mobile');
    const click = vi.spyOn(fileInput(), 'click').mockImplementation(() => undefined);

    host.querySelector<HTMLButtonElement>('button.cam')!.click();

    expect(click).toHaveBeenCalled();
    expect(fileInput().accept).toBe('image/*');
    expect(fileInput().getAttribute('capture')).toBe('environment');
  });

  it('Desktop: „Scannen“ neben der Eingabezeile öffnet die Foto-Auswahl', () => {
    setup('desktop');
    const click = vi.spyOn(fileInput(), 'click').mockImplementation(() => undefined);

    expect(host.querySelector('button.cam')).toBeNull();
    const scan = Array.from(host.querySelectorAll('button')).find(b => b.textContent?.includes('Scannen'))!;
    scan.click();

    expect(click).toHaveBeenCalled();
  });

  it('gewähltes Foto startet den Scan', () => {
    setup('mobile');
    const emitted: File[] = [];
    fixture.componentInstance.scan.subscribe(file => emitted.push(file));
    const photo = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    const transfer = new DataTransfer();
    transfer.items.add(photo);
    fileInput().files = transfer.files;

    fileInput().dispatchEvent(new Event('change'));

    expect(emitted).toEqual([photo]);
    // gleiche Datei erneut wählbar
    expect(fileInput().value).toBe('');
  });
});
