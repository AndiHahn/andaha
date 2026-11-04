import type { MockedObject } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { CategoryUpdateDto } from 'src/app/api/shopping/dtos/CategoryUpdateDto';
import { PageTitleService } from 'src/app/core/page-title/page-title.service';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { ShowErrorModule } from 'src/app/shared/form-field/show-error.module';
import { createSubCategoryForm } from '../functions/form-functions';
import { CategoryItemDetailsComponent } from './category-item-details.component';

describe('CategoryItemDetailsComponent', () => {
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
    imports: [ReactiveFormsModule, ShowErrorModule, MatSelectModule, NoopAnimationsModule, CategoryItemDetailsComponent],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [
        { provide: Router, useValue: {
                navigateByUrl: vi.fn().mockName("Router.navigateByUrl")
            } },
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

    it('second save keeps server ids of subcategories created by the first save', () => {
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
});
