import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { BillTemplateDto } from 'src/app/api/shopping/dtos/BillTemplateDto';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { HistoryTrailService } from 'src/app/core/navigation/history-trail.service';
import { BillTemplateContextService } from 'src/app/features/bill/services/bill-template-context.service';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { TemplateEditComponent } from './template-edit.component';

const categories: CategoryDto[] = [
  { id: 'c1', name: 'Lebensmittel', color: '#7FB89A', order: 0, includeToStatistics: true, isDefault: false, subCategories: [{ id: 's1', name: 'Gebäck', order: 0 }] },
  { id: 'c2', name: 'Freizeit', color: '#8AA6D9', order: 1, includeToStatistics: true, isDefault: false, subCategories: [] }
];

const existing: BillTemplateDto = { id: 't1', name: 'Wocheneinkauf', shopName: 'Billa', categoryId: 'c1', subCategoryId: 's1', sortOrder: 0 };

describe('TemplateEditComponent', () => {
  let fixture: ComponentFixture<TemplateEditComponent>;
  let service: { save: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> };
  let historyTrail: { leaveTo: ReturnType<typeof vi.fn> };
  let snackbar: { openFromComponent: ReturnType<typeof vi.fn> };
  let confirm: boolean;

  async function setup(id: string | null, list: BillTemplateDto[] = [existing], cats: CategoryDto[] = categories, failed = false) {
    confirm = true;
    snackbar = { openFromComponent: vi.fn() };
    historyTrail = { leaveTo: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [TemplateEditComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: MatSnackBar, useValue: snackbar },
        { provide: HistoryTrailService, useValue: historyTrail },
        { provide: ActivatedRoute, useValue: { snapshot: { params: id ? { id } : {}, children: [], parent: null } } },
        { provide: BillCategoryContextService, useValue: { categories: () => of(cats) } },
        {
          provide: ConfirmationDialogService,
          useValue: { openDialog: vi.fn().mockImplementation(() => Promise.resolve({ afterClosed: () => of(confirm) })) }
        },
        {
          provide: BillTemplateContextService,
          useValue: {
            save: vi.fn().mockResolvedValue(undefined),
            remove: vi.fn().mockResolvedValue(undefined),
            templates: () => new BehaviorSubject(list),
            retry: vi.fn(),
            loadFailed: () => of(failed),
            loaded: () => of(true)
          }
        }
      ]
    }).compileComponents();
    service = TestBed.inject(BillTemplateContextService) as unknown as typeof service;
    fixture = TestBed.createComponent(TemplateEditComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('prefills the form from the template', async () => {
    await setup('t1');
    expect(fixture.componentInstance.form.getRawValue()).toEqual({
      name: 'Wocheneinkauf', shopMode: 'fixed', shopName: 'Billa', categoryId: 'c1', subCategoryId: 's1'
    });
  });

  it('saves "Beim Erfassen wählen" as shopName null', async () => {
    await setup('t1');
    fixture.componentInstance.form.patchValue({ shopMode: 'choose' });
    await fixture.componentInstance.onSave();
    expect(service.save).toHaveBeenCalledWith('t1', { name: 'Wocheneinkauf', shopName: null, categoryId: 'c1', subCategoryId: 's1' });
    expect(historyTrail.leaveTo).toHaveBeenCalledWith('/settings/templates');
  });

  it('chooses the segment by radio and hides the shop field', async () => {
    await setup('t1');
    const radios = fixture.nativeElement.querySelectorAll('input[type=radio]') as NodeListOf<HTMLInputElement>;
    radios[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.form.controls.shopMode.value).toBe('choose');
    expect(fixture.nativeElement.querySelector('input[name=shopName]')).toBeNull();
  });

  it('creates a template with a fixed shop and without name', async () => {
    await setup(null);
    fixture.componentInstance.form.patchValue({ shopMode: 'fixed', shopName: ' Bäcker ', categoryId: 'c2' });
    await fixture.componentInstance.onSave();
    expect(service.save).toHaveBeenCalledWith(null, { name: undefined, shopName: 'Bäcker', categoryId: 'c2', subCategoryId: null });
  });

  it('creates a choose-shop template without touching the shop field', async () => {
    await setup(null);
    (fixture.nativeElement.querySelectorAll('input[type=radio]')[1] as HTMLInputElement).click();
    fixture.detectChanges();
    fixture.componentInstance.form.patchValue({ categoryId: 'c1' });
    await fixture.componentInstance.onSave();
    expect(service.save).toHaveBeenCalledWith(null, { name: undefined, shopName: null, categoryId: 'c1', subCategoryId: null });
  });

  it('clearing the name of an existing template sends no name', async () => {
    await setup('t1');
    fixture.componentInstance.form.patchValue({ name: '' });
    await fixture.componentInstance.onSave();
    expect(service.save).toHaveBeenCalledWith('t1', { name: undefined, shopName: 'Billa', categoryId: 'c1', subCategoryId: 's1' });
  });

  it('explains that a category is needed first when there are none', async () => {
    await setup(null, [], []);
    expect(fixture.nativeElement.textContent).toContain('Lege zuerst eine Kategorie an');
    expect(fixture.nativeElement.querySelector('a[href="/settings/categories"]')).not.toBeNull();
  });

  it('shows an error with retry when loading the templates failed', async () => {
    await setup('t1', [existing], categories, true);
    expect(fixture.nativeElement.textContent).toContain('konnten nicht geladen werden');
    (fixture.nativeElement.querySelector('app-load-state .state-retry') as HTMLButtonElement).click();
    expect(TestBed.inject(BillTemplateContextService).retry).toHaveBeenCalled();
  });

  it('does not save while the shop is missing for a fixed shop', async () => {
    await setup(null);
    fixture.componentInstance.form.patchValue({ categoryId: 'c1' });
    await fixture.componentInstance.onSave();
    expect(service.save).not.toHaveBeenCalled();
  });


  it('template form shows field errors', async () => {
    await setup(null);
    const host: HTMLElement = fixture.nativeElement;
    const errorOf = (selector: string) =>
      host.querySelector(selector)!.closest('.field')!.querySelector('.field-error')?.textContent?.trim();

    expect(host.querySelector('.field-error')).toBeNull();

    // Speichern ohne Shop und Kategorie: die Fehler stehen an den Feldern
    await fixture.componentInstance.onSave();
    fixture.detectChanges();
    expect(errorOf('input[name="shopName"]')).toBe('Pflichtfeld');
    expect(errorOf('mat-select[formControlName="categoryId"]')).toBe('Pflichtfeld');

    // Längen wie im Backend-Validator (Name 100, Shopname 200)
    fixture.componentInstance.form.patchValue({ name: 'x'.repeat(101), shopName: 'y'.repeat(201), categoryId: 'c1' });
    fixture.detectChanges();
    expect(errorOf('input[name="name"]')).toBe('Höchstens 100 Zeichen');
    expect(errorOf('input[name="shopName"]')).toBe('Höchstens 200 Zeichen');
    expect(errorOf('mat-select[formControlName="categoryId"]')).toBeUndefined();
    await fixture.componentInstance.onSave();
    expect(service.save).not.toHaveBeenCalled();
  });

  it('resets the subcategory when the category changes', async () => {
    await setup('t1');
    fixture.componentInstance.form.controls.categoryId.setValue('c2');
    expect(fixture.componentInstance.form.controls.subCategoryId.value).toBeNull();
  });

  it('shows an error and stays when saving fails', async () => {
    await setup('t1');
    service.save.mockRejectedValue(new Error('offline'));
    await fixture.componentInstance.onSave();
    expect(snackbar.openFromComponent).toHaveBeenCalled();
    expect(historyTrail.leaveTo).not.toHaveBeenCalled();
  });

  it('asks before deleting and then removes', async () => {
    await setup('t1');
    const vibrate = vi.spyOn(navigator, 'vibrate').mockImplementation(() => true);
    await fixture.componentInstance.onDelete();
    expect(service.remove).toHaveBeenCalledWith('t1');
    expect(vibrate).toHaveBeenCalled();
    expect(historyTrail.leaveTo).toHaveBeenCalledWith('/settings/templates');
    vibrate.mockRestore();
  });

  it('keeps the template when the deletion is not confirmed', async () => {
    await setup('t1');
    confirm = false;
    await fixture.componentInstance.onDelete();
    expect(service.remove).not.toHaveBeenCalled();
  });

  it('has no delete button when creating', async () => {
    await setup(null);
    expect(fixture.nativeElement.querySelector('button.del')).toBeNull();
  });

  it('leaves to the list when the template does not exist', async () => {
    await setup('nope');
    expect(historyTrail.leaveTo).toHaveBeenCalledWith('/settings/templates');
  });
});
