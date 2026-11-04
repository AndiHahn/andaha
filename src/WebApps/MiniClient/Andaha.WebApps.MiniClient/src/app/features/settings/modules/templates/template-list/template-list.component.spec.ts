import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { BillSuggestionDto } from 'src/app/api/shopping/dtos/BillSuggestionDto';
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

describe('TemplateListComponent', () => {
  let fixture: ComponentFixture<TemplateListComponent>;
  let service: { reorder: ReturnType<typeof vi.fn>; pin: ReturnType<typeof vi.fn> };
  let snackbar: { openFromComponent: ReturnType<typeof vi.fn> };

  async function setup(t: BillTemplateDto[] = templates, s: BillSuggestionDto[] = suggestions) {
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
            templates: () => new BehaviorSubject(t),
            suggestions: () => new BehaviorSubject(s),
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

  it('offers adding a template', async () => {
    await setup();
    const add = fixture.nativeElement.querySelector('a.add') as HTMLAnchorElement;
    expect(text(add)).toContain('Vorlage hinzufügen');
    expect(add.getAttribute('href')).toBe('/create');
  });
});
