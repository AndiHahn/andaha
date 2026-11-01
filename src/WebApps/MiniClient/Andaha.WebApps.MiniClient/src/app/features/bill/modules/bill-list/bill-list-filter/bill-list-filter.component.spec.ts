import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { BillListFilterDialogService } from './bill-list-filter-dialog/bill-list-filter-dialog.service';
import { BillListFilterComponent } from './bill-list-filter.component';

describe('BillListFilterComponent search', () => {
  let fixture: ComponentFixture<BillListFilterComponent>;
  let component: BillListFilterComponent;
  let emitted: string[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BillListFilterComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: BillListFilterDialogService, useValue: { openDialog: () => Promise.resolve(undefined) } },
        { provide: BillCategoryContextService, useValue: { categories: () => of([]) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BillListFilterComponent);
    component = fixture.componentInstance;
    emitted = [];
    component.searchTextChanged.subscribe(value => emitted.push(value));
    fixture.detectChanges();
  });

  it('does not search before 600 ms of typing pause', fakeAsync(() => {
    component.onSearchInput('Bil');
    tick(599);
    expect(emitted).toEqual([]);
    tick(1);
    expect(emitted).toEqual(['Bil']);
  }));

  it('searches only the last value while typing quickly', fakeAsync(() => {
    component.onSearchInput('B');
    tick(300);
    component.onSearchInput('Bi');
    tick(300);
    component.onSearchInput('Bil');
    tick(600);
    expect(emitted).toEqual(['Bil']);
  }));

  it('searches immediately on enter', fakeAsync(() => {
    component.onSearchInput('Billa');
    component.onSearchEnter('Billa');
    expect(emitted).toEqual(['Billa']);
    tick(600);
    expect(emitted).toEqual(['Billa']);
  }));

  it('trims the search text and ignores whitespace-only changes', fakeAsync(() => {
    component.onSearchInput('Billa ');
    tick(600);
    expect(emitted).toEqual(['Billa']);
    component.onSearchInput('Billa  ');
    tick(600);
    expect(emitted).toEqual(['Billa']);
  }));

  it('emits an empty search immediately when the field is cleared by typing', fakeAsync(() => {
    component.onSearchInput('Billa');
    tick(600);
    component.onSearchInput('');
    expect(emitted).toEqual(['Billa', '']);
  }));

  it('emits an empty search immediately on clear button', fakeAsync(() => {
    component.onSearchInput('Billa');
    tick(600);
    component.onClearSearch();
    expect(emitted).toEqual(['Billa', '']);
  }));

  it('searches the same term again after clearing', fakeAsync(() => {
    component.onSearchInput('Billa');
    tick(600);
    component.onClearSearch();
    component.onSearchInput('Billa');
    tick(600);
    expect(emitted).toEqual(['Billa', '', 'Billa']);
  }));

  it('binds input and keyup.enter instead of keyup', fakeAsync(() => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');

    input.value = 'X';
    input.dispatchEvent(new Event('input'));
    tick(600);
    expect(emitted).toEqual(['X']);

    input.value = 'Y';
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Unidentified' }));
    tick(600);
    expect(emitted).toEqual(['X']);

    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
    expect(emitted).toEqual(['X', 'Y']);
  }));
  it('does not search when the field returns to the initial (empty) value', fakeAsync(() => {
    component.onSearchInput('B');
    tick(300);
    component.onSearchInput('');
    tick(600);
    expect(emitted).toEqual([]);
  }));

  it('does not search again for the restored initial search text', fakeAsync(() => {
    const restored = TestBed.createComponent(BillListFilterComponent);
    const restoredEmitted: string[] = [];
    restored.componentInstance.initialSearchText = 'Billa';
    restored.componentInstance.searchTextChanged.subscribe(value => restoredEmitted.push(value));
    restored.detectChanges();

    restored.componentInstance.onSearchEnter('Billa');
    tick(600);
    expect(restoredEmitted).toEqual([]);
  }));
});
