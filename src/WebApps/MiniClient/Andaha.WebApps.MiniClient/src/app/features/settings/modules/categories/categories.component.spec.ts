import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { CategoriesComponent } from './categories.component';

describe('CategoriesComponent order save errors', () => {
  let openFromComponent: ReturnType<typeof vi.fn>;
  let updateCategoryOrders: ReturnType<typeof vi.fn>;

  const category = (id: string, order: number): CategoryDto => ({
    id, name: 'Kategorie ' + id, color: '#ff0000', order, includeToStatistics: true, isDefault: order === 0, subCategories: []
  });

  function create(): CategoriesComponent {
    openFromComponent = vi.fn();
    updateCategoryOrders = vi.fn();
    TestBed.configureTestingModule({
      imports: [CategoriesComponent],
      providers: [
        provideRouter([]),
        { provide: MatSnackBar, useValue: { openFromComponent } },
        {
          provide: BillCategoryContextService,
          useValue: { categories: () => of([category('a', 0), category('b', 1)]), error: signal(false), retry: vi.fn(), updateCategoryOrders }
        }
      ]
    });
    const fixture = TestBed.createComponent(CategoriesComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  const errors: [string, HttpErrorResponse][] = [
    ['400 with an object body', new HttpErrorResponse({ status: 400, error: { title: 'Validation failed' } })],
    ['500 with a text body', new HttpErrorResponse({ status: 500, error: 'System.Exception: boom' })],
    ['500 without a body', new HttpErrorResponse({ status: 500, error: null })]
  ];

  for (const [name, error] of errors) {
    it(`${name}: snackbar shows the German text only`, () => {
      const component = create();
      updateCategoryOrders.mockReturnValue(throwError(() => error));

      component.isEditing = true;
      component.onSaveClick();

      const messages = openFromComponent.mock.calls.map(call => call[1].data);
      expect(messages).toEqual(['Reihenfolge der Kategorien konnte nicht gespeichert werden.']);
      expect(component.isSaving).toBe(false);
    });
  }
});
