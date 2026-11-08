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

  it('warns on the raw fraction like the backend rules, shows the rounded percent', () => {
    const host = render({ shop: 0.746, date: 0.796, amount: 0.896, document: 0.74 });
    expect(row(host, 'shop').textContent).toContain('75 %');
    expect(row(host, 'shop').classList).toContain('warn');
    expect(row(host, 'date').classList).toContain('warn');
    expect(row(host, 'amount').textContent).toContain('90 %');
    expect(row(host, 'amount').classList).toContain('warn');
    expect(row(host, 'document').classList).toContain('warn');
  });

  it('does not warn at exactly the threshold', () => {
    const host = render({ shop: 0.75, date: 0.8, amount: 0.9, document: 0.75 });
    for (const key of ['shop', 'date', 'amount', 'document']) {
      expect(row(host, key).classList).not.toContain('warn');
    }
  });

  it('shows the raw amount text hint only when given', () => {
    expect(row(render({ amount: 0.5, amountText: '7,' }), 'amount').textContent).toContain('erkannt: 7,');
    expect(render({ amount: 0.5 }).textContent).not.toContain('erkannt');
  });
});
