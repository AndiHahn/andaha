import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MorePageComponent } from './more-page.component';

describe('MorePageComponent', () => {
  let fixture: ComponentFixture<MorePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MorePageComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(MorePageComponent);
    fixture.detectChanges();
  });

  function texts(selector: string): string[] {
    return Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll(selector)).map(e => e.textContent!.trim());
  }

  it('groups the entries in sections', () => {
    expect(texts('.sect')).toEqual(['Einstellungen', 'Daten']);
    expect(texts('.mrow .label')).toEqual(['Kategorien', 'Verbindungen', 'Export']);
  });

  it('links the entries and the legal pages', () => {
    const hrefs = Array.from<HTMLAnchorElement>(fixture.nativeElement.querySelectorAll('a')).map(a => a.getAttribute('href'));
    expect(hrefs).toEqual(['/settings/categories', '/settings/connections', '/export', '/agb', '/data-protection', '/user-data']);
    expect(texts('.links a')).toEqual(['AGB', 'Datenschutzerklärung', 'Benutzerdaten']);
  });
});
