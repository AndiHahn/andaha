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

  it('mobil: Kamera-Knopf öffnet die Foto-Auswahl, mehrere Fotos, ohne capture', () => {
    setup('mobile');
    const click = vi.spyOn(fileInput(), 'click').mockImplementation(() => undefined);

    host.querySelector<HTMLButtonElement>('button.cam')!.click();

    expect(click).toHaveBeenCalled();
    expect(fileInput().accept).toBe('image/*');
    expect(fileInput().multiple).toBe(true);
    expect(fileInput().hasAttribute('capture')).toBe(false);
  });

  it('Desktop: „Scannen“ neben der Eingabezeile öffnet die Foto-Auswahl', () => {
    setup('desktop');
    const click = vi.spyOn(fileInput(), 'click').mockImplementation(() => undefined);

    expect(host.querySelector('button.cam')).toBeNull();
    const scan = Array.from(host.querySelectorAll('button')).find(b => b.textContent?.includes('Scannen'))!;
    scan.click();

    expect(click).toHaveBeenCalled();
  });

  it('Desktop: der Eingabe-Input erlaubt ebenfalls mehrere Fotos', () => {
    setup('desktop');

    expect(fileInput().multiple).toBe(true);
    expect(fileInput().hasAttribute('capture')).toBe(false);
  });

  it('gewählte Fotos werden gemeinsam gemeldet', () => {
    setup('mobile');
    const emitted: File[][] = [];
    fixture.componentInstance.scan.subscribe(files => emitted.push(files));
    const photos = ['a', 'b', 'c'].map(name => new File([name], `${name}.jpg`, { type: 'image/jpeg' }));
    const transfer = new DataTransfer();
    photos.forEach(photo => transfer.items.add(photo));
    fileInput().files = transfer.files;

    fileInput().dispatchEvent(new Event('change'));

    expect(emitted).toEqual([photos]);
    // gleiche Datei erneut wählbar
    expect(fileInput().value).toBe('');
  });
});
