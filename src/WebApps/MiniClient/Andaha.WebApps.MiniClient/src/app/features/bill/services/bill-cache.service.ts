import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { BillCreateCacheItem, BillCreateDto } from '../../../api/shopping/dtos/BillCreateDto';
import { dataUrlToBase64, fileDataUriToBlob, imageBlobToFile } from '../../../shared/utils/file-utils';
import { compressImage } from '../../../shared/utils/image-utils';
import { PendingBillStore } from './pending-bill-store.service';

@Injectable({
  providedIn: 'root'
})
export class BillCacheService {
  private pendingBillStore = inject(PendingBillStore);

  private billAdded$: Subject<void> = new Subject();

  private LEGACY_BILLS_CACHE_KEY: string = 'Bills|New';

  private migration: Promise<void>;

  constructor() {
    this.migration = this.migrateLegacyBills();
  }

  public billAdded(): Observable<void> {
    return this.billAdded$.asObservable();
  }

  public async saveNewBillLocal(bill: BillCreateDto): Promise<void> {
    const image = bill.image ? await compressImage(bill.image) : undefined;

    await this.pendingBillStore.put({ ...bill, image });

    this.billAdded$.next();
  }

  public removeBillLocal(billId: string): Promise<void> {
    return this.pendingBillStore.delete(billId);
  }

  public async getBillsToSync(): Promise<BillCreateDto[]> {
    await this.migration;

    return this.pendingBillStore.getAll();
  }

  public async migrateLegacyBills(): Promise<void> {
    try {
      const billsJson = localStorage.getItem(this.LEGACY_BILLS_CACHE_KEY);
      if (!billsJson) {
        return;
      }

      const legacyBills: BillCreateCacheItem[] = JSON.parse(billsJson);
      const failed: BillCreateCacheItem[] = [];
      for (const legacyBill of legacyBills) {
        try {
          await this.pendingBillStore.put(this.cacheItemToDto(legacyBill));
        } catch (error) {
          failed.push(legacyBill);
          console.error('Migration of a legacy bill failed', error);
        }
      }

      if (failed.length === 0) {
        localStorage.removeItem(this.LEGACY_BILLS_CACHE_KEY);
      } else {
        // Keep only the failed entries so migrated ones are not re-imported on the next start.
        localStorage.setItem(this.LEGACY_BILLS_CACHE_KEY, JSON.stringify(failed));
      }
    } catch (error) {
      console.error('Migration of legacy bills failed, keeping them in localStorage', error);
    }
  }

  private cacheItemToDto(bill: BillCreateCacheItem): BillCreateDto {
    let file: File | undefined = undefined;
    if (bill.image) {
      const base64 = dataUrlToBase64(bill.image);
      const blob = fileDataUriToBlob(base64);
      file = imageBlobToFile(blob);
    }

    return {
      id: bill.id,
      shopName: bill.shopName,
      date: new Date(bill.date),
      categoryId: bill.categoryId,
      subCategoryId: bill.subCategoryId,
      price: bill.price,
      notes: bill.notes,
      image: file
    }
  }
}
