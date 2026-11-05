import type { MockedObject } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { HistoryTrailService } from 'src/app/core/navigation/history-trail.service';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { CategoryUpdateDto } from 'src/app/api/shopping/dtos/CategoryUpdateDto';
import { PageTitleService } from 'src/app/core/page-title/page-title.service';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { ShowErrorPipe } from 'src/app/shared/form-field/show-error.pipe';
import { createSubCategoryForm } from '../functions/form-functions';
import { CategoryItemDetailsComponent } from './category-item-details.component';

describe('CategoryItemDetailsComponent', () => {
    let historyTrail: { leaveTo: ReturnType<typeof vi.fn> };
    let fixture: ComponentFixture<CategoryItemDetailsComponent>;
    let context: MockedObject<BillCategoryContextService>;

    const category: CategoryDto = {
        id: 'cat-1',
        name: 'Essen',
        color: '#ff0000',
        order: 0,
        includeToStatistics: true,
        isDefault: false,
        subCategories: [{ id: 'sub-0', name: 'Alt', order: 0 }]
    };

    beforeEach(async () => {
        historyTrail = { leaveTo: vi.fn() };
        context = {
            categoryById: vi.fn().mockName("BillCategoryContextService.categoryById"),
            getCategoryById: vi.fn().mockName("BillCategoryContextService.getCategoryById"),
            updateCategory: vi.fn().mockName("BillCategoryContextService.updateCategory")
        } as unknown as MockedObject<BillCategoryContextService>;
        context.categoryById.mockReturnValue(of(category));
        const pageTitle = {
            set: vi.fn().mockName("PageTitleService.set"),
            setAction: vi.fn().mockName("PageTitleService.setAction")
        };

        await TestBed.configureTestingModule({
    imports: [ReactiveFormsModule, ShowErrorPipe, MatSelectModule, NoopAnimationsModule, CategoryItemDetailsComponent],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [
        { provide: Router, useValue: {
                navigateByUrl: vi.fn().mockName("Router.navigateByUrl")
            } },
        { provide: HistoryTrailService, useValue: historyTrail },
        { provide: MatSnackBar, useValue: {
                openFromComponent: vi.fn().mockName("MatSnackBar.openFromComponent")
            } },
        { provide: BillCategoryContextService, useValue: context },
        { provide: PageTitleService, useValue: pageTitle },
        { provide: ConfirmationDialogService, useValue: {} },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'cat-1' }, children: [], parent: null } } }
    ]
}).compileComponents();

        fixture = TestBed.createComponent(CategoryItemDetailsComponent);
    });

    function stubConfirmation(confirmed: boolean) {
        const openDialog = vi.fn().mockResolvedValue({ afterClosed: () => of(confirmed) });
        (TestBed.inject(ConfirmationDialogService) as unknown as { openDialog: unknown }).openDialog = openDialog;
        return openDialog;
    }

    it('removing a subcategory asks confirmation', async () => {
        fixture.detectChanges();
        const component = fixture.componentInstance;
        const openDialog = stubConfirmation(false);

        component.onEditClick();
        component.onDeleteSubCategoryClick(0);
        await Promise.resolve();
        await Promise.resolve();
        expect(openDialog).toHaveBeenCalledTimes(1);
        expect(component.subCategoryForms.length).toBe(1);

        stubConfirmation(true);
        component.onDeleteSubCategoryClick(0);
        await Promise.resolve();
        await Promise.resolve();
        expect(component.subCategoryForms.length).toBe(0);
    });

    it('after save cancel restores saved state', () => {
        fixture.detectChanges();
        const component = fixture.componentInstance;
        context.updateCategory.mockReturnValue(of(undefined));
        context.getCategoryById.mockReturnValue({ ...category, name: 'Gespeichert', color: '#2e4fa8' });

        component.onEditClick();
        component.form.controls.name.setValue('Gespeichert');
        component.onSaveClick();
        component.onEditClick();
        component.form.controls.name.setValue('Verworfen');
        component.onCancelClick();

        expect(component.form.controls.name.value).toBe('Gespeichert');
        expect(component.form.controls.color.value).toBe('#2e4fa8');
    });

    it('default category: delete disabled with explanation', () => {
        context.categoryById.mockReturnValue(of({ ...category, isDefault: true, subCategories: [] }));
        fixture.detectChanges();
        const el: HTMLElement = fixture.nativeElement;

        expect((el.querySelector('.btn.del') as HTMLButtonElement).disabled).toBe(true);
        expect(el.textContent).toContain('Die Standardkategorie kann nicht gelöscht werden. Rechnungen gelöschter Kategorien landen hier.');
    });

    it('non-default category: delete enabled and no explanation', () => {
        fixture.detectChanges();
        const el: HTMLElement = fixture.nativeElement;

        expect((el.querySelector('.btn.del') as HTMLButtonElement).disabled).toBe(false);
        expect(el.textContent).not.toContain('Die Standardkategorie kann nicht gelöscht werden');
    });

    it('save, add subcategory, save again sends server id (no duplicate)', () => {
        fixture.detectChanges();
        const component = fixture.componentInstance;
        const updates: CategoryUpdateDto[] = [];
        context.updateCategory.mockImplementation((_id, dto) => { updates.push(dto); return of(undefined); });
        context.getCategoryById.mockReturnValue({
            ...category,
            subCategories: [
                { id: 'sub-0', name: 'Alt', order: 0 },
                { id: 'srv-1', name: 'Neu', order: 1 }
            ]
        });

        component.onEditClick();
        component.subCategoryForms.push(createSubCategoryForm('Neu'));
        component.onSaveClick();

        component.onEditClick();
        component.onSaveClick();

        expect(updates.length).toBe(2);
        expect(updates[1].subCategories.map(s => s.id)).toEqual(['sub-0', 'srv-1']);
    });

    it('save failed: German text only, no server response in the snackbar', () => {
        fixture.detectChanges();
        const component = fixture.componentInstance;
        const snackbar = TestBed.inject(MatSnackBar) as unknown as { openFromComponent: ReturnType<typeof vi.fn> };
        context.updateCategory.mockReturnValue(throwError(() => new HttpErrorResponse({
            status: 400, error: { title: 'One or more validation errors occurred.' }
        })));

        component.onEditClick();
        component.onSaveClick();

        expect(snackbar.openFromComponent).toHaveBeenCalledTimes(1);
        expect(snackbar.openFromComponent.mock.calls[0][1].data).toBe('Kategorie konnte nicht gespeichert werden.');
        expect(component.isEditing).toBe(true);
    });
});
