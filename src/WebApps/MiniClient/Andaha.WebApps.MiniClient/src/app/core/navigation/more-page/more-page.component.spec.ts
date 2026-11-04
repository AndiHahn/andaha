import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { BillTemplateContextService } from 'src/app/features/bill/services/bill-template-context.service';
import { MorePageComponent } from './more-page.component';

describe('MorePageComponent', () => {
  let fixture: ComponentFixture<MorePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MorePageComponent],
      providers: [
        provideRouter([]),
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
    expect(texts('.mrow .label')).toEqual(['Kategorien', 'Vorlagen', 'Verbindungen', 'Export']);
  });

  it('links the entries and the legal pages', () => {
    const hrefs = Array.from<HTMLAnchorElement>(fixture.nativeElement.querySelectorAll('a')).map(a => a.getAttribute('href'));
    expect(hrefs).toEqual(['/settings/categories', '/settings/templates', '/settings/connections', '/export', '/agb', '/data-protection', '/user-data']);
    expect(texts('.links a')).toEqual(['AGB', 'Datenschutzerklärung', 'Benutzerdaten']);
  });

  it('shows the number of templates next to Vorlagen only', () => {
    expect(texts('.mrow .side')).toEqual(['3']);
    expect(texts('.mrow')[1]).toContain('Vorlagen');
  });
});
