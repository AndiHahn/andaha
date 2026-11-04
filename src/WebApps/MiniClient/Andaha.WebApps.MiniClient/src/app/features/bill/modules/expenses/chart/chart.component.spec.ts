import type { MockedObject } from "vitest";
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ExpenseDto } from 'src/app/api/shopping/dtos/ExpenseDto';
import { ChartComponent } from './chart.component';

registerLocaleData(localeDe, 'de');

describe('ChartComponent', () => {
    let fixture: ComponentFixture<ChartComponent>;
    let component: ChartComponent;
    let matDialog: MockedObject<MatDialog>;

    const exp = (category: string, costs: number, color?: string): ExpenseDto => ({ category, costs, color, subCategories: [] });

    const categories: any[] = [
        { name: 'A', color: 'red' },
        { name: 'B', color: 'blue' },
        { name: 'C', color: 'green' }
    ];

    function setup(expenses: ExpenseDto[], hidden: string[] = [], sum = 0) {
        component.expenses = expenses;
        component.categories = categories;
        component.hiddenCategories = hidden;
        component.sum = sum;
        component.ngOnChanges({
            expenses: new SimpleChange(undefined, expenses, true),
            hiddenCategories: new SimpleChange(undefined, hidden, true)
        });
        fixture.detectChanges();
    }

    const el = (): HTMLElement => fixture.nativeElement;
    const rows = () => Array.from(el().querySelectorAll('.lg')) as HTMLElement[];
    const bg = () => component.chartDatasets[0].backgroundColor;

    beforeEach(() => {
        matDialog = {
            open: vi.fn().mockName("MatDialog.open")
        } as unknown as MockedObject<MatDialog>;
        matDialog.open.mockReturnValue({ afterClosed: () => of(undefined) } as any);
        TestBed.configureTestingModule({
            imports: [ChartComponent],
            providers: [{ provide: MatDialog, useValue: matDialog }]
        });
        fixture = TestBed.createComponent(ChartComponent);
        component = fixture.componentInstance;
    });

    it('uses color from expense dto', () => {
        setup([exp('X', 5, 'purple')]);
        expect(bg()).toEqual(['purple']);
        expect((el().querySelector('.dot') as HTMLElement).style.background).toContain('purple');
    });

    it('falls back to own category color', () => {
        setup([exp('B', 5)]);
        expect(bg()).toEqual(['blue']);
    });

    it('falls back to grey for unknown category without color', () => {
        setup([exp('A', 10), exp('Fremd', 5), exp('C', 3)]);
        expect(bg()).toEqual(['red', 'grey', 'green']);
        const dots = Array.from(el().querySelectorAll('.dot')) as HTMLElement[];
        expect(dots.map(d => d.style.background)).toEqual(['red', 'grey', 'green']);
    });

    it('hidden category is not drawn', () => {
        setup([exp('A', 10), exp('B', 5), exp('C', 3)], ['A'], 8);
        expect(component.chartLabels).toEqual(['B', 'C']);
        expect(bg()).toEqual(['blue', 'green']);
        expect(rows().length).toBe(3);
        expect(rows()[0].classList).toContain('hidden');
        expect(rows()[0].querySelector('.p')!.textContent).toContain('–');
        expect(rows()[0].querySelector('.p')!.textContent).not.toContain('%');
    });

    it('segment click maps to visible expense', () => {
        setup([exp('A', 10), exp('B', 5), exp('C', 3)], ['A'], 8);
        component.chartClicked({ active: [{ index: 0 }] });
        expect((vi.mocked(matDialog.open).mock.lastCall![1] as any).data.expense.category).toBe('B');
    });

    it('legend row opens details of its own expense', () => {
        setup([exp('A', 10), exp('B', 5), exp('C', 3)], ['A'], 8);
        (rows()[0].querySelector('.lg-main') as HTMLElement).click();
        expect((vi.mocked(matDialog.open).mock.lastCall![1] as any).data.expense.category).toBe('A');
    });

    it('eye button emits toggle', () => {
        setup([exp('A', 10), exp('B', 5), exp('C', 3)], ['A'], 8);
        const emitted: string[] = [];
        component.visibilityToggled.subscribe(v => emitted.push(v));
        const eyeB = rows()[1].querySelector('.lg-eye') as HTMLElement;
        const eyeA = rows()[0].querySelector('.lg-eye') as HTMLElement;
        expect(eyeB.getAttribute('aria-label')).toBe('B ausblenden');
        expect(eyeA.getAttribute('aria-label')).toBe('A einblenden');
        eyeB.click();
        expect(emitted).toEqual(['B']);
    });

    it('percent relative to sum', () => {
        setup([exp('A', 10), exp('B', 10)], ['A'], 20);
        expect(component.percentOf(component.expenses[1])).toBe(50);
        expect(component.percentOf(component.expenses[0])).toBeNull();
    });

    it('all hidden shows dash and empty dataset', () => {
        setup([exp('A', 10), exp('B', 5)], ['A', 'B'], 0);
        expect(component.chartDatasets[0].data).toEqual([]);
        rows().forEach(r => expect(r.querySelector('.p')!.textContent).toContain('–'));
    });
});
