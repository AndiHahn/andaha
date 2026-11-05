import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { ShopStatDto } from 'src/app/api/shopping/dtos/ShopStatDto';
import { ContextService } from 'src/app/core/context.service';
import { ShopStatsContextService } from './shop-stats-context.service';

function stat(shopName: string, categoryId: string, subCategoryId: string | null, count: number, day: number): ShopStatDto {
  return { shopName, categoryId, subCategoryId, count, lastUsed: new Date(2026, 0, day) };
}

function create(stats: ShopStatDto[]): ShopStatsContextService {
  TestBed.configureTestingModule({
    providers: [
      { provide: BillApiService, useValue: { getShopStats: () => of(stats) } },
      { provide: ContextService, useValue: { backendUnreachable: () => false, backendReady: () => of(true) } }
    ]
  });
  return TestBed.inject(ShopStatsContextService);
}

describe('ShopStatsContextService', () => {
  it('frequentShops sorts by count and cuts at max (default 5)', () => {
    const svc = create([1, 2, 3, 4, 5, 6, 7].map(i => stat('S' + i, 'c', null, i, 1)));
    expect(svc.frequentShops('c', null)).toEqual(['S7', 'S6', 'S5', 'S4', 'S3']);
    expect(svc.frequentShops('c', null, 2)).toEqual(['S7', 'S6']);
  });

  it('frequentShops distinguishes subcategory; null aggregates all of the category', () => {
    const svc = create([
      stat('A', 'c', 's1', 3, 1),
      stat('B', 'c', 's2', 4, 1),
      stat('A', 'c', 's2', 2, 1),
      stat('X', 'other', null, 99, 1)
    ]);
    expect(svc.frequentShops('c', 's1')).toEqual(['A']);
    expect(svc.frequentShops('c', 's2')).toEqual(['B', 'A']);
    expect(svc.frequentShops('c', null)).toEqual(['A', 'B']);
  });

  it('lastCategoryFor is case-insensitive and picks the most recent use', () => {
    const svc = create([stat('Rewe', 'old', null, 9, 1), stat('rewe', 'new', 's', 1, 5)]);
    expect(svc.lastCategoryFor('REWE')).toEqual({ categoryId: 'new', subCategoryId: 's' });
    expect(svc.lastCategoryFor('unknown')).toBeUndefined();
  });

  it('shopNames filters by case-insensitive prefix, distinct, sorted by count', () => {
    const svc = create([
      stat('Aldi', 'c', null, 1, 1),
      stat('Rewe', 'c', null, 5, 1),
      stat('Rewe', 'd', null, 2, 1),
      stat('rewe', 'e', null, 1, 1),
      stat('Real', 'c', null, 3, 1)
    ]);
    expect(svc.shopNames()).toEqual(['Rewe', 'Real', 'Aldi']);
    expect(svc.shopNames('re')).toEqual(['Rewe', 'Real']);
  });

  it('recordLocal increments count/lastUsed without reload and adds new entries', () => {
    const svc = create([stat('Rewe', 'c', null, 1, 1)]);
    svc.recordLocal('rewe', 'c', null, new Date(2026, 5, 1));
    svc.recordLocal('Aldi', 'd', 's', new Date(2026, 5, 2));
    expect(svc.lastCategoryFor('Aldi')).toEqual({ categoryId: 'd', subCategoryId: 's' });
    expect(svc.shopNames()).toEqual(['Rewe', 'Aldi']);
    svc.recordLocal('Rewe', 'x', null, new Date(2026, 6, 1));
    expect(svc.lastCategoryFor('Rewe')).toEqual({ categoryId: 'x', subCategoryId: null });
    expect(svc.frequentShops('c', null)).toEqual(['Rewe']);
    expect(svc.shopNames()).toEqual(['Rewe', 'Aldi']);
  });
});
