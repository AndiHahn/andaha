import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { ExpenseDto } from 'src/app/api/shopping/dtos/ExpenseDto';
import { ExpenseContextService } from 'src/app/features/bill/services/expense-context.service';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { ExpensesComponent } from './expenses.component';

describe('ExpensesComponent', () => {
  let fixture: ComponentFixture<ExpensesComponent>;
  let component: ExpensesComponent;
  let expenses$: BehaviorSubject<ExpenseDto[] | undefined>;

  const expense = (category: string, costs: number): ExpenseDto => ({ category, costs, subCategories: [] });

  beforeEach(() => {
    expenses$ = new BehaviorSubject<ExpenseDto[] | undefined>([expense('A', 10.10), expense('B', 5.20)]);

    TestBed.configureTestingModule({
      declarations: [ExpensesComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {
          provide: ExpenseContextService,
          useValue: {
            expenses: () => expenses$,
            availableTimeRange: () => new BehaviorSubject(undefined),
            loadExpenses: jasmine.createSpy('loadExpenses')
          }
        },
        { provide: BillCategoryContextService, useValue: { categories: () => of([]) } }
      ]
    });
    TestBed.overrideTemplate(ExpensesComponent, '');
    fixture = TestBed.createComponent(ExpensesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('toggle hides and shows', () => {
    const r0 = component.hiddenCategories;
    component.toggleCategory('A');
    const r1 = component.hiddenCategories;
    expect(r1).toEqual(['A']);
    component.toggleCategory('A');
    const r2 = component.hiddenCategories;
    expect(r2).toEqual([]);
    expect(r1).not.toBe(r0);
    expect(r2).not.toBe(r1);
  });

  it('sum only over visible', () => {
    expect(component.sum).toBe(15.3);
    component.toggleCategory('A');
    expect(component.sum).toBe(5.2);
  });

  it('hidden survives new expenses', () => {
    component.toggleCategory('A');
    expenses$.next([expense('A', 1), expense('C', 2)]);
    expect(component.hiddenCategories).toEqual(['A']);
    expect(component.sum).toBe(2);
  });

  it('sum is 0 when all hidden', () => {
    component.toggleCategory('A');
    component.toggleCategory('B');
    expect(component.sum).toBe(0);
  });
});
