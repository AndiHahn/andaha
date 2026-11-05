import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PersonDto } from 'src/app/api/work/dtos/PersonDto';
import { PersonListComponent } from './person-list.component';

describe('PersonListComponent', () => {
  let fixture: ComponentFixture<PersonListComponent>;

  function person(id: string, total: [number, number], payed: [number, number], hourlyRate = 15): PersonDto {
    return {
      id,
      name: `Person ${id}`,
      hourlyRate,
      totalHours: { hours: total[0], minutes: total[1] },
      payedHours: { hours: payed[0], minutes: payed[1] },
      payments: []
    };
  }

  function render(persons: PersonDto[]): HTMLElement {
    fixture.componentRef.setInput('persons', persons);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function rows(host: HTMLElement): HTMLElement[] {
    return Array.from(host.querySelectorAll<HTMLElement>('a.row'));
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonListComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(PersonListComponent);
  });

  it('shows open amount in euro', () => {
    const host = render([person('a', [86, 30], [74, 0], 15)]);

    const row = rows(host)[0];
    expect(row.querySelector('.open-amount')?.textContent?.trim()).toBe('187,50 €');
    expect(row.querySelector('.open-hours')?.textContent?.trim()).toBe('12:30 h offen');
  });

  it('"Zahlung offen" only when openAmount > 0', () => {
    const host = render([
      person('open', [12, 30], [0, 0], 15),
      person('overpaid', [10, 0], [12, 30], 15),
      person('no-rate', [12, 30], [0, 0], 0),
      person('settled', [10, 0], [10, 0], 15)
    ]);

    const paymentOpen = rows(host).map(row => row.querySelector('.tag')?.textContent?.includes('Zahlung offen') ?? false);
    expect(paymentOpen).toEqual([true, false, false, false]);
    expect(rows(host)[1].querySelector('.open-amount')?.textContent?.trim()).toBe('0,00 €');
  });
});
