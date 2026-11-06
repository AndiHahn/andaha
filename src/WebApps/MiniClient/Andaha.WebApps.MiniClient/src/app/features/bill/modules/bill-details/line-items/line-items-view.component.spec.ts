import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BillLineItemDto } from 'src/app/api/shopping/dtos/BillLineItemDto';
import { LineItemsViewComponent } from './line-items-view.component';

const make = (n: number): BillLineItemDto[] =>
  Array.from({ length: n }, (_, i) => ({ id: `i${i}`, description: `Artikel ${i}`, totalPrice: 1 }));

describe('LineItemsViewComponent', () => {
  let fixture: ComponentFixture<LineItemsViewComponent>;
  let host: HTMLElement;

  const render = (items: BillLineItemDto[], price = 0, initialQuery = '') => {
    fixture = TestBed.createComponent(LineItemsViewComponent);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('price', price);
    fixture.componentRef.setInput('initialQuery', initialQuery);
    fixture.detectChanges();
    host = fixture.nativeElement;
  };

  it('hidden without items', () => {
    render([]);
    expect(host.textContent?.trim()).toBe('');
  });

  it('shows quantity × unit price line, sum and deviation hint; discounts in --pos', () => {
    render(
      [
        { id: '1', description: 'Milch', quantity: 2, unitPrice: 1.49, totalPrice: 2.98 },
        { id: '2', description: 'Rabatt', totalPrice: -0.5 }
      ],
      42
    );
    const text = host.textContent!.replace(/\s+/g, ' ');
    expect(text).toContain('Positionen');
    expect(text).toContain('2 × 1,49 €');
    expect(text).toContain('Summe der Positionen: 2,48 €');
    expect(text).toContain('Weicht vom Rechnungsbetrag ab (42,00 €)');
    expect(host.querySelectorAll('.amt.neg').length).toBe(1);
  });

  it('no deviation hint when the sum matches', () => {
    render([{ id: '1', description: 'Milch', totalPrice: 2 }], 2);
    expect(host.querySelector('.deviation')).toBeNull();
  });

  it('filter appears from 8 items', () => {
    render(make(7));
    expect(host.querySelector('input')).toBeNull();
    render(make(8));
    expect(host.querySelector<HTMLInputElement>('input[aria-label="Positionen durchsuchen"]')).not.toBeNull();
  });

  it('?q= preselects and highlights', () => {
    render(make(8), 8, 'artikel 3');
    expect(host.querySelector<HTMLInputElement>('input')!.value).toBe('artikel 3');
    const marked = host.querySelectorAll('.line-item.match');
    expect(marked.length).toBe(1);
    expect(marked[0].textContent).toContain('Artikel 3');
  });

  it('typing in the filter highlights matches', () => {
    render(make(8));
    const input = host.querySelector<HTMLInputElement>('input')!;
    input.value = 'Artikel';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.querySelectorAll('.line-item.match').length).toBe(8);
  });

  it('under 8 items highlights only with initialQuery and has no filter', () => {
    render(make(3), 3, 'artikel 1');
    expect(host.querySelector('input')).toBeNull();
    expect(host.querySelectorAll('.line-item.match').length).toBe(1);
  });
});
