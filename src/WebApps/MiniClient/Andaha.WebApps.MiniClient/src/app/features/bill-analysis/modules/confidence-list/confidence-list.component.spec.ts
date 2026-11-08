import { TestBed } from '@angular/core/testing';
import { ConfidenceListComponent } from './confidence-list.component';

describe('ConfidenceListComponent', () => {
  function render(inputs: Record<string, unknown>): HTMLElement {
    const fixture = TestBed.createComponent(ConfidenceListComponent);
    for (const [k, v] of Object.entries(inputs)) {
      fixture.componentRef.setInput(k, v);
    }
    fixture.detectChanges();
    return fixture.nativeElement;
  }
  const row = (host: HTMLElement, key: string) => host.querySelector<HTMLElement>(`[data-row="${key}"]`)!;

  it('shows four rows with rounded percent and a dash for missing values', () => {
    const host = render({ shop: 0.876, date: null, amount: 0.95 });
    expect(Array.from(host.querySelectorAll('.conf-label')).map(e => e.textContent)).toEqual(['Shop', 'Datum', 'Betrag', 'Dokument']);
    expect(row(host, 'shop').textContent).toContain('88 %');
    expect(row(host, 'date').textContent).toContain('–');
    expect(row(host, 'date').querySelector('.conf-bar')).toBeNull();
    expect(row(host, 'document').textContent).toContain('–');
  });

  it('marks values below their threshold with warn (rounded percent, strictly below)', () => {
    const host = render({ shop: 0.74, date: 0.8, amount: 0.89, document: 0.75 });
    expect(row(host, 'shop').classList).toContain('warn');
    expect(row(host, 'date').classList).not.toContain('warn');
    expect(row(host, 'amount').classList).toContain('warn');
    expect(row(host, 'document').classList).not.toContain('warn');
  });

  it('shows the raw amount text hint only when given', () => {
    expect(row(render({ amount: 0.5, amountText: '7,' }), 'amount').textContent).toContain('erkannt: 7,');
    expect(render({ amount: 0.5 }).textContent).not.toContain('erkannt');
  });
});
