import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { CreateCategoryComponent } from './create-category.component';

describe('CreateCategoryComponent save errors', () => {
  let openFromComponent: ReturnType<typeof vi.fn>;
  let createCategory: ReturnType<typeof vi.fn>;

  function create(): CreateCategoryComponent {
    openFromComponent = vi.fn();
    createCategory = vi.fn();
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, CreateCategoryComponent],
      providers: [
        { provide: Router, useValue: { navigateByUrl: vi.fn() } },
        { provide: MatSnackBar, useValue: { openFromComponent } },
        { provide: BillCategoryContextService, useValue: { createCategory } }
      ]
    });
    const fixture = TestBed.createComponent(CreateCategoryComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.form.controls.name.setValue('ZZ Kategorie');
    component.form.controls.color.setValue('#ff0000');
    return component;
  }

  const errors: [string, HttpErrorResponse][] = [
    ['400 with an object body', new HttpErrorResponse({ status: 400, error: { title: 'Validation failed' } })],
    ['500 with a text body', new HttpErrorResponse({ status: 500, error: 'System.Exception: boom' })]
  ];

  for (const [name, error] of errors) {
    it(`${name}: snackbar shows the German text only, form stays editable`, () => {
      const component = create();
      createCategory.mockReturnValue(throwError(() => error));

      component.onSaveClick();

      const messages = openFromComponent.mock.calls.map(call => call[1].data);
      expect(messages).toEqual(['Kategorie konnte nicht erstellt werden.']);
      expect(component.form.enabled).toBe(true);
      expect(component.isSaving).toBe(false);
    });
  }
});
