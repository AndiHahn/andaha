import { ComponentFixture, TestBed } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { provideRouter } from '@angular/router';
import { CostCategory } from 'src/app/api/budgetplan/dtos/CostCategory';
import { Duration } from 'src/app/api/budgetplan/dtos/Duration';
import { FixedCostDto } from 'src/app/api/budgetplan/dtos/FixedCostDto';
import { FixedCostListComponent } from './fixed-cost-list.component';

registerLocaleData(localeDe, 'de');

describe('FixedCostListComponent', () => {
  let fixture: ComponentFixture<FixedCostListComponent>;

  const cost = (id: string, name: string, value: number, duration: Duration): FixedCostDto =>
    ({ id, name, value, duration, category: CostCategory.FlatAndOperating });

  function create(fixedCosts: FixedCostDto[]): HTMLElement {
    TestBed.configureTestingModule({ imports: [FixedCostListComponent], providers: [provideRouter([])] });
    fixture = TestBed.createComponent(FixedCostListComponent);
    fixture.componentRef.setInput('category', CostCategory.FlatAndOperating);
    fixture.componentRef.setInput('fixedCosts', fixedCosts);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  const normalized = (element: Element) => element.textContent!.replace(/\s+/g, ' ').trim();

  it('section header shows "… € / Monat"', () => {
    const el = create([
      cost('1', 'Miete', 980, Duration.Monthly),
      cost('2', 'Strom', 360, Duration.QuarterYear),
      cost('3', 'Haftpflicht', 240, Duration.Year),
      cost('4', 'Internet', 120, Duration.HalfYear)
    ]);

    expect(normalized(el.querySelector('.sec')!)).toBe('Wohnen1.140,00 € / Monat');
  });

  it('row shows monthly value for non-monthly', () => {
    const el = create([cost('1', 'Miete', 980, Duration.Monthly), cost('2', 'Strom', 360, Duration.QuarterYear)]);
    const rows = el.querySelectorAll('.row');

    expect(normalized(rows[0])).toBe('Miete980,00 € monatlich');
    expect(normalized(rows[1])).toBe('Strom360,00 € vierteljährlich · 120,00 € / Monat');
  });

  it('shows zero for an empty category', () => {
    const el = create([]);

    expect(normalized(el.querySelector('.sec')!)).toBe('Wohnen0,00 € / Monat');
    expect(el.querySelector('.empty')).not.toBeNull();
  });
});
