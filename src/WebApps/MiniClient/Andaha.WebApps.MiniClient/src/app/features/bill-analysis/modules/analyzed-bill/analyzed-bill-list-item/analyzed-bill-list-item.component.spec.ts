import { ComponentFixture, TestBed } from '@angular/core/testing';
import { page } from 'vitest/browser';
import { BillAnalyzedDto } from 'src/app/api/shopping/dtos/BillAnalyzedDto';
import { AnalyzedBillListItemComponent } from './analyzed-bill-list-item.component';

const bill: BillAnalyzedDto = {
  id: 'a1',
  shopName: 'Billa',
  price: 12.5,
  date: new Date(2026, 10, 3),
  imageAvailable: true,
  lineItems: []
};

describe('AnalyzedBillListItemComponent', () => {
  let fixture: ComponentFixture<AnalyzedBillListItemComponent>;
  let host: HTMLElement;

  async function render(changes: Partial<BillAnalyzedDto> = {}): Promise<void> {
    fixture = TestBed.createComponent(AnalyzedBillListItemComponent);
    fixture.componentRef.setInput('bill', { ...bill, ...changes });
    host = fixture.nativeElement;
    document.body.appendChild(host);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  const row = () => host.querySelector<HTMLElement>('.analyzed-row')!;
  const reasons = () => host.querySelector<HTMLElement>('.reasons');

  beforeEach(async () => {
    await page.viewport(390, 844);
    TestBed.configureTestingModule({ imports: [AnalyzedBillListItemComponent] });
  });

  afterEach(() => host?.remove());

  it('zeigt die Kurztexte der Gründe mit Trenner und verstecktem Icon', async () => {
    await render({ notCreatedReasons: ['DateMissing', 'CategoryUnclear'] });

    expect(reasons()).not.toBeNull();
    expect(reasons()!.textContent!.replace(/\s+/g, ' ').trim()).toContain('Datum fehlt · Kategorie unklar');
    expect(reasons()!.querySelector('mat-icon')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('ohne Gründe oder nur mit unbekannten Codes: keine Zeile', async () => {
    await render();
    expect(reasons()).toBeNull();
    fixture.destroy();
    host.remove();

    await render({ notCreatedReasons: ['Foo'] });
    expect(reasons()).toBeNull();
  });

  it('die Zeile ist mit und ohne Gründe 80 px hoch', async () => {
    await render();
    expect(row().getBoundingClientRect().height).toBe(80);
    fixture.destroy();
    host.remove();

    await render({ notCreatedReasons: ['DateMissing'] });
    expect(row().getBoundingClientRect().height).toBe(80);
  });

  it('alle Gründe bei 390 px: einzeilig mit Ellipsis, Höhe bleibt 80', async () => {
    await render({
      notCreatedReasons: ['ShopMissing', 'DateMissing', 'AmountMissing', 'LowConfidence', 'AmountUncertain', 'CategoryUnclear']
    });

    const el = reasons()!;
    expect(el.scrollWidth).toBeGreaterThan(el.clientWidth);
    expect(el.getBoundingClientRect().height).toBeLessThan(20);
    expect(row().getBoundingClientRect().height).toBe(80);
  });

  it('drei Zeilen laufen auch mit mat-typography (line-height 20 px) nicht über den Inhaltsbereich', async () => {
    document.body.classList.add('mat-typography');
    document.body.style.lineHeight = '20px';
    try {
      await render({ notCreatedReasons: ['DateMissing'] });

      const rowEl = row();
      const style = getComputedStyle(rowEl);
      const content =
        rowEl.getBoundingClientRect().height -
        parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) -
        parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth);
      const main = host.querySelector<HTMLElement>('.main')!;

      expect(main.getBoundingClientRect().height).toBeLessThanOrEqual(content);
      expect(rowEl.getBoundingClientRect().height).toBe(80);
    } finally {
      document.body.classList.remove('mat-typography');
      document.body.style.lineHeight = '';
    }
  });
});
