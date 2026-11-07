import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TourService } from 'src/app/core/tour/tour.service';
import { BehaviorSubject } from 'rxjs';
import { BillTemplateContextService } from 'src/app/features/bill/services/bill-template-context.service';
import { MorePageComponent } from './more-page.component';

describe('MorePageComponent', () => {
  let fixture: ComponentFixture<MorePageComponent>;
  let request: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    request = vi.fn();
    await TestBed.configureTestingModule({
      imports: [MorePageComponent],
      providers: [
        provideRouter([{ path: 'bill/list', children: [] }]),
        { provide: TourService, useValue: { request } },
        { provide: BillTemplateContextService, useValue: { templates: () => new BehaviorSubject([{ id: 'a' }, { id: 'b' }, { id: 'c' }]) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MorePageComponent);
    fixture.detectChanges();
  });

  function texts(selector: string): string[] {
    return Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll(selector)).map(e => e.textContent!.trim());
  }

  it('groups the entries in sections', () => {
    expect(texts('.sect')).toEqual(['Einstellungen', 'Daten']);
    expect(texts('.mrow .label')).toEqual(['Kategorien', 'Vorlagen', 'Verbindungen', 'Export', 'Schnell-Hilfe']);
  });

  it('links the entries and the legal pages', () => {
    const hrefs = Array.from<HTMLAnchorElement>(fixture.nativeElement.querySelectorAll('a')).map(a => a.getAttribute('href'));
    expect(hrefs).toEqual(['/settings/categories', '/settings/templates', '/settings/connections', '/export', '/bill/list', '/agb', '/data-protection', '/user-data']);
    expect(texts('.links a')).toEqual(['AGB', 'Datenschutzerklärung', 'Benutzerdaten']);
  });

  it('shows the number of templates next to Vorlagen only', () => {
    expect(texts('.mrow .side')).toEqual(['3']);
    expect(texts('.mrow')[1]).toContain('Vorlagen');
  });

  it('clicking Schnell-Hilfe requests the tour and navigates to /bill/list', async () => {
    const link = Array.from<HTMLAnchorElement>(fixture.nativeElement.querySelectorAll('a.mrow')).find(a => a.textContent!.includes('Schnell-Hilfe'))!;
    link.click();
    await fixture.whenStable();

    expect(request).toHaveBeenCalledTimes(1);
    expect(TestBed.inject(Router).url).toBe('/bill/list');
  });

  it('other entries do not request the tour', () => {
    const link = Array.from<HTMLAnchorElement>(fixture.nativeElement.querySelectorAll('a.mrow')).find(a => a.textContent!.includes('Export'))!;
    link.addEventListener('click', e => e.preventDefault());
    link.click();

    expect(request).not.toHaveBeenCalled();
  });
});
