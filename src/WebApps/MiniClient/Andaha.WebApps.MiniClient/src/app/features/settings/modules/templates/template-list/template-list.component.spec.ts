import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { BillSuggestionDto } from 'src/app/api/shopping/dtos/BillSuggestionDto';
import { HiddenBillSuggestionDto } from 'src/app/api/shopping/dtos/HiddenBillSuggestionDto';
import { BillTemplateDto } from 'src/app/api/shopping/dtos/BillTemplateDto';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { BillTemplateContextService } from 'src/app/features/bill/services/bill-template-context.service';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { TemplateListComponent } from './template-list.component';

const categories: CategoryDto[] = [
  { id: 'c1', name: 'Lebensmittel', color: '#7FB89A', order: 0, includeToStatistics: true, isDefault: false, subCategories: [{ id: 's1', name: 'Gebäck', order: 0 }] },
  { id: 'c2', name: 'Freizeit', color: '#8AA6D9', order: 1, includeToStatistics: true, isDefault: false, subCategories: [{ id: 's2', name: 'Bücher', order: 0 }] }
];

const templates: BillTemplateDto[] = [
  { id: 't1', name: null, shopName: 'Bäcker Ruetz', categoryId: 'c1', subCategoryId: 's1', sortOrder: 0 },
  { id: 't2', name: 'Wocheneinkauf', shopName: null, categoryId: 'c1', subCategoryId: null, sortOrder: 1 },
  { id: 't3', name: null, shopName: 'Alt', categoryId: 'gone', subCategoryId: null, sortOrder: 2 }
];

const suggestions: BillSuggestionDto[] = [
  { shopName: 'Thalia', categoryId: 'c2', subCategoryId: 's2', count: 5 }
];

const hidden: HiddenBillSuggestionDto[] = [
  { id: 'h1', shopName: 'Spar', categoryId: 'c1', categoryName: 'Lebensmittel', subCategoryId: 's1', subCategoryName: 'Gebäck' },
  { id: 'h2', shopName: 'Thalia', categoryId: 'c2', categoryName: 'Freizeit', subCategoryId: null, subCategoryName: null }
];

describe('TemplateListComponent', () => {
  let fixture: ComponentFixture<TemplateListComponent>;
  let service: {
    reorder: ReturnType<typeof vi.fn>;
    pin: ReturnType<typeof vi.fn>;
    listHiddenSuggestions: ReturnType<typeof vi.fn>;
    unhideSuggestion: ReturnType<typeof vi.fn>;
  };
  let snackbar: { openFromComponent: ReturnType<typeof vi.fn> };

  async function setup(
    t: BillTemplateDto[] = templates,
    s: BillSuggestionDto[] = suggestions,
    failed = false,
    hiddenList: () => Observable<HiddenBillSuggestionDto[]> = () => of([])
  ) {
    snackbar = { openFromComponent: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [TemplateListComponent],
      providers: [
        provideRouter([]),
        { provide: MatSnackBar, useValue: snackbar },
        { provide: BillCategoryContextService, useValue: { categories: () => of(categories) } },
        {
          provide: BillTemplateContextService,
          useValue: {
            reorder: vi.fn().mockResolvedValue(undefined),
            pin: vi.fn().mockResolvedValue({}),
            listHiddenSuggestions: vi.fn(hiddenList),
            unhideSuggestion: vi.fn().mockResolvedValue(undefined),
            templates: () => new BehaviorSubject(t),
            suggestions: () => new BehaviorSubject(s),
            retry: vi.fn(),
            loadFailed: () => of(failed),
            loaded: () => of(true)
          }
        }
      ]
    }).compileComponents();
    service = TestBed.inject(BillTemplateContextService) as unknown as typeof service;
    fixture = TestBed.createComponent(TemplateListComponent);
    fixture.detectChanges();
  }

  const rows = () => Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.drag-item'));
  const hiddenRows = () => Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.hidden-row'));
  const text = (e: Element) => e.textContent!.replace(/\s+/g, ' ').trim();

  it('lists pinned templates in order with name or shop and category line', async () => {
    await setup();
    expect(rows().map(r => `${text(r.querySelector('.t')!)} ${text(r.querySelector('.s')!)}`)).toEqual([
      'Bäcker Ruetz Lebensmittel · Gebäck',
      'Wocheneinkauf Lebensmittel · Shop beim Erfassen',
      'Alt Kategorie fehlt'
    ]);
    expect(rows()[0].querySelector('a')!.getAttribute('href')).toBe('/t1');
  });

  it('calls reorder with the new id order when a drag ends', async () => {
    await setup();
    await fixture.componentInstance.drop({ previousIndex: 0, currentIndex: 1 } as never);
    expect(service.reorder).toHaveBeenCalledWith(['t2', 't1', 't3']);
  });

  it('does not reorder when dropped on the same position', async () => {
    await setup();
    await fixture.componentInstance.drop({ previousIndex: 1, currentIndex: 1 } as never);
    expect(service.reorder).not.toHaveBeenCalled();
  });

  it('shows an error when reordering fails', async () => {
    await setup();
    service.reorder.mockRejectedValue(new Error('offline'));
    await fixture.componentInstance.drop({ previousIndex: 0, currentIndex: 1 } as never);
    expect(snackbar.openFromComponent).toHaveBeenCalled();
  });

  it('shows suggestions with frequency and pins one', async () => {
    await setup();
    const row = fixture.nativeElement.querySelector('.suggestion') as HTMLElement;
    expect(text(row)).toContain('Thalia');
    expect(text(row)).toContain('Freizeit · Bücher');
    expect(text(row)).toContain('5×');
    (row.querySelector('button.act') as HTMLButtonElement).click();
    expect(service.pin).toHaveBeenCalledWith(suggestions[0]);
  });

  it('shows empty states without templates and suggestions', async () => {
    await setup([], []);
    const t = text(fixture.nativeElement);
    expect(t).toContain('Noch keine Vorlagen');
    expect(t).toContain('Noch keine Vorschläge');
  });

  it('does not list suggestions that a template already covers', async () => {
    const covered: BillSuggestionDto[] = [
      { shopName: 'Bäcker Ruetz', categoryId: 'c1', subCategoryId: 's1', count: 4 },
      { shopName: 'Billa', categoryId: 'c1', subCategoryId: null, count: 3 },
      suggestions[0]
    ];
    await setup(templates, covered);
    const rows = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.suggestion'));
    expect(rows.map(r => text(r.querySelector('.t')!))).toEqual(['Thalia']);
  });

  it('shows an error with retry when loading failed', async () => {
    await setup([], [], true);
    expect(text(fixture.nativeElement)).toContain('konnten nicht geladen werden');
    (fixture.nativeElement.querySelector('app-load-state .state-retry') as HTMLButtonElement).click();
    expect(TestBed.inject(BillTemplateContextService).retry).toHaveBeenCalled();
  });

  it('offers adding a template', async () => {
    await setup();
    const add = fixture.nativeElement.querySelector('a.add') as HTMLAnchorElement;
    expect(text(add)).toContain('Vorlage hinzufügen');
    expect(add.getAttribute('href')).toBe('/create');
  });

  it('hidden section lists suggestions and "Wieder anzeigen" unhides', async () => {
    await setup(templates, suggestions, false, () => of(hidden));
    const heads = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.sect')).map(h => text(h));
    expect(heads.at(-1)).toContain('Ausgeblendet');
    expect(hiddenRows().map(r => `${text(r.querySelector('.t')!)} ${text(r.querySelector('.s')!)}`)).toEqual([
      'Spar Lebensmittel · Gebäck',
      'Thalia Freizeit'
    ]);

    const button = hiddenRows()[0].querySelector('button.act') as HTMLButtonElement;
    expect(text(button)).toContain('Wieder anzeigen');
    button.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(service.unhideSuggestion).toHaveBeenCalledWith('h1');
    expect(hiddenRows().map(r => text(r.querySelector('.t')!))).toEqual(['Thalia']);
  });

  it('hidden section explains the empty state', async () => {
    await setup();
    expect(text(fixture.nativeElement)).toContain('Keine ausgeblendeten Vorschläge');
  });

  it('hidden section shows an error with retry and reloads', async () => {
    let fail = true;
    await setup(templates, suggestions, false, () => fail ? throwError(() => new Error('500')) : of(hidden));
    const retry = fixture.nativeElement.querySelector('.hidden-state .state-retry') as HTMLButtonElement;
    expect(retry).not.toBeNull();

    fail = false;
    retry.click();
    fixture.detectChanges();

    expect(service.listHiddenSuggestions).toHaveBeenCalledTimes(2);
    expect(hiddenRows().length).toBe(2);
  });

  it('keeps the hidden suggestion and shows an error when unhiding fails', async () => {
    await setup(templates, suggestions, false, () => of(hidden));
    service.unhideSuggestion.mockRejectedValue(new Error('offline'));

    (hiddenRows()[0].querySelector('button.act') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(snackbar.openFromComponent).toHaveBeenCalled();
    expect(hiddenRows().length).toBe(2);
  });
});
