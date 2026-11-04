import { Injectable, inject } from '@angular/core';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { ShopStatDto } from 'src/app/api/shopping/dtos/ShopStatDto';
import { ContextService } from 'src/app/core/context.service';

@Injectable({
  providedIn: 'root'
})
export class ShopStatsContextService {
  private contextService = inject(ContextService);
  private billApi = inject(BillApiService);

  private stats: ShopStatDto[] = [];

  constructor() {
    this.contextService.backendReady().subscribe(ready => {
      if (ready) {
        this.load();
      }
    });
  }

  shopNames(prefix?: string): string[] {
    const normalizedPrefix = prefix?.trim().toLowerCase() ?? '';
    const groups = new Map<string, { total: number; spellings: Map<string, number> }>();

    for (const stat of this.stats) {
      const key = stat.shopName.toLowerCase();
      if (!key.startsWith(normalizedPrefix)) {
        continue;
      }
      const group = groups.get(key) ?? { total: 0, spellings: new Map<string, number>() };
      group.total += stat.count;
      group.spellings.set(stat.shopName, (group.spellings.get(stat.shopName) ?? 0) + stat.count);
      groups.set(key, group);
    }

    return [...groups.values()]
      .sort((a, b) => b.total - a.total)
      .map(group => [...group.spellings.entries()].sort((a, b) => b[1] - a[1])[0][0]);
  }

  frequentShops(categoryId: string, subCategoryId: string | null, max = 5): string[] {
    const totals = new Map<string, { name: string; count: number }>();

    for (const stat of this.stats) {
      if (stat.categoryId !== categoryId) {
        continue;
      }
      if (subCategoryId !== null && (stat.subCategoryId ?? null) !== subCategoryId) {
        continue;
      }
      const key = stat.shopName.toLowerCase();
      const entry = totals.get(key) ?? { name: stat.shopName, count: 0 };
      entry.count += stat.count;
      totals.set(key, entry);
    }

    return [...totals.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, max)
      .map(entry => entry.name);
  }

  lastCategoryFor(shopName: string): { categoryId: string; subCategoryId: string | null } | undefined {
    const key = shopName.trim().toLowerCase();
    let latest: ShopStatDto | undefined;

    for (const stat of this.stats) {
      if (stat.shopName.toLowerCase() === key && (!latest || stat.lastUsed.getTime() > latest.lastUsed.getTime())) {
        latest = stat;
      }
    }

    return latest ? { categoryId: latest.categoryId, subCategoryId: latest.subCategoryId ?? null } : undefined;
  }

  recordLocal(shopName: string, categoryId: string, subCategoryId: string | null, date: Date): void {
    const key = shopName.toLowerCase();
    const existing = this.stats.find(s =>
      s.shopName.toLowerCase() === key && s.categoryId === categoryId && (s.subCategoryId ?? null) === subCategoryId);

    if (existing) {
      existing.count++;
      if (date.getTime() > existing.lastUsed.getTime()) {
        existing.lastUsed = date;
      }
    } else {
      this.stats.push({ shopName, categoryId, subCategoryId, count: 1, lastUsed: date });
    }
  }

  private load(): void {
    this.billApi.getShopStats().subscribe({
      next: stats => this.stats = stats.map(s => ({ ...s })),
      error: error => console.error('Loading shop stats failed', error)
    });
  }
}
