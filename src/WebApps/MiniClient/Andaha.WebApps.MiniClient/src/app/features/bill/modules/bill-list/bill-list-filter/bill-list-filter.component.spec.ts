import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { BillListFilterDialogService } from './bill-list-filter-dialog/bill-list-filter-dialog.service';
import { BillListFilterComponent } from './bill-list-filter.component';

describe('BillListFilterComponent search', () => {
    beforeEach(() => {
        vi.useFakeTimers({ advanceTimeDelta: 1, shouldAdvanceTime: true });
    });
    afterEach(() => {
        vi.useRealTimers();
    });
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

    it('does not search before 600 ms of typing pause', async () => {
        component.onSearchInput('Bil');
        await vi.advanceTimersByTimeAsync(599);
        expect(emitted).toEqual([]);
        await vi.advanceTimersByTimeAsync(1);
        expect(emitted).toEqual(['Bil']);
    });

    it('searches only the last value while typing quickly', async () => {
        component.onSearchInput('B');
        await vi.advanceTimersByTimeAsync(300);
        component.onSearchInput('Bi');
        await vi.advanceTimersByTimeAsync(300);
        component.onSearchInput('Bil');
        await vi.advanceTimersByTimeAsync(600);
        expect(emitted).toEqual(['Bil']);
    });

    it('searches immediately on enter', async () => {
        component.onSearchInput('Billa');
        component.onSearchEnter('Billa');
        expect(emitted).toEqual(['Billa']);
        await vi.advanceTimersByTimeAsync(600);
        expect(emitted).toEqual(['Billa']);
    });

    it('trims the search text and ignores whitespace-only changes', async () => {
        component.onSearchInput('Billa ');
        await vi.advanceTimersByTimeAsync(600);
        expect(emitted).toEqual(['Billa']);
        component.onSearchInput('Billa  ');
        await vi.advanceTimersByTimeAsync(600);
        expect(emitted).toEqual(['Billa']);
    });

    it('emits an empty search immediately when the field is cleared by typing', async () => {
        component.onSearchInput('Billa');
        await vi.advanceTimersByTimeAsync(600);
        component.onSearchInput('');
        expect(emitted).toEqual(['Billa', '']);
    });

    it('emits an empty search immediately on clear button', async () => {
        component.onSearchInput('Billa');
        await vi.advanceTimersByTimeAsync(600);
        component.onClearSearch();
        expect(emitted).toEqual(['Billa', '']);
    });

    it('searches the same term again after clearing', async () => {
        component.onSearchInput('Billa');
        await vi.advanceTimersByTimeAsync(600);
        component.onClearSearch();
        component.onSearchInput('Billa');
        await vi.advanceTimersByTimeAsync(600);
        expect(emitted).toEqual(['Billa', '', 'Billa']);
    });

    it('binds input and keyup.enter instead of keyup', async () => {
        const input: HTMLInputElement = fixture.nativeElement.querySelector('input');

        input.value = 'X';
        input.dispatchEvent(new Event('input'));
        await vi.advanceTimersByTimeAsync(600);
        expect(emitted).toEqual(['X']);

        input.value = 'Y';
        input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Unidentified' }));
        await vi.advanceTimersByTimeAsync(600);
        expect(emitted).toEqual(['X']);

        input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
        expect(emitted).toEqual(['X', 'Y']);
    });
    it('does not search when the field returns to the initial (empty) value', async () => {
        component.onSearchInput('B');
        await vi.advanceTimersByTimeAsync(300);
        component.onSearchInput('');
        await vi.advanceTimersByTimeAsync(600);
        expect(emitted).toEqual([]);
    });

    it('does not search again for the restored initial search text', async () => {
        const restored = TestBed.createComponent(BillListFilterComponent);
        const restoredEmitted: string[] = [];
        restored.componentInstance.initialSearchText = 'Billa';
        restored.componentInstance.searchTextChanged.subscribe(value => restoredEmitted.push(value));
        restored.detectChanges();

        restored.componentInstance.onSearchEnter('Billa');
        await vi.advanceTimersByTimeAsync(600);
        expect(restoredEmitted).toEqual([]);
    });
});
