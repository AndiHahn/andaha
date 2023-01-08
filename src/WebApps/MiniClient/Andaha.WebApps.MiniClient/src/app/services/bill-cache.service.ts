import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { BillCreateCacheItem, BillCreateDto } from '../api/shopping/dtos/BillCreateDto';
import { blobToDataUrl, dataUrlToBase64, fileDataUriToBlob, imageBlobToFile } from '../shared/utils/file-utils';

@Injectable({
  providedIn: 'root'
})
export class BillCacheService {
  private billAdded$: Subject<void> = new Subject();

  private NEW_BILLS_CACHE_KEY: string = 'Bills|New';

  private currentlySyncing: BillCreateCacheItem[] = [];

  public billAdded(): Observable<void> {
    return this.billAdded$.asObservable();
  }

  public saveNewBillLocal(bill: BillCreateDto): void {
    this.saveBill(bill);
  }

  public removeBillLocal(billId: string): void {
    const bill = this.currentlySyncing.find(syncingBill => syncingBill.id == billId);
    if (bill) {
      const index = this.currentlySyncing.indexOf(bill);
      this.currentlySyncing.splice(index, 1);
    }

    this.removeBill(billId);
  }

  public getBillsToSync(): BillCreateDto[] {
    const billsToSync = this.getSavedBills();

    this.currentlySyncing.forEach(syncingBill => {
      const bill = billsToSync.find(bill => bill.id == syncingBill.id);
      if (bill) {
        const index = billsToSync.indexOf(bill);
        billsToSync.splice(index, 1);
      }
    });

    this.currentlySyncing = this.currentlySyncing.concat(billsToSync);

    const billCreateDtos: BillCreateDto[] = [];
    billsToSync.forEach(bill => billCreateDtos.push(this.cacheItemToDto(bill)));

    return billCreateDtos;
  }

  private removeBill(billId: string): void {
    const allBills = this.getSavedBills();
    const bill = allBills.find(bill => bill.id == billId);
    if (bill) {
      const index = allBills.indexOf(bill);
      allBills.splice(index, 1);

      if (allBills.length > 0) {
        localStorage.setItem(this.NEW_BILLS_CACHE_KEY, JSON.stringify(allBills));
      } else {
        localStorage.removeItem(this.NEW_BILLS_CACHE_KEY);
      }
    }
  }

  private saveBill(bill: BillCreateDto): void {
    const allBills = this.getSavedBills();

    this.dtoToCacheItem(bill).then(billToCache => {
      allBills.push(billToCache);

      localStorage.setItem(this.NEW_BILLS_CACHE_KEY, JSON.stringify(allBills));

      this.billAdded$.next();
    });
  }
  
  private getSavedBills(): BillCreateCacheItem[] {
    const billsJson = localStorage.getItem(this.NEW_BILLS_CACHE_KEY);
    if (!billsJson) {
      return [];
    }

    const cachedBills: BillCreateCacheItem[] = JSON.parse(billsJson);

    return cachedBills;
  }

  private dtoToCacheItem(bill: BillCreateDto): Promise<BillCreateCacheItem> {
    const cacheItem: BillCreateCacheItem = {
      id: bill.id,
      shopName: bill.shopName,
      categoryId: bill.categoryId,
      subCategoryId: bill.subCategoryId,
      date: bill.date,
      price: bill.price,
      notes: bill.notes
    }

    return new Promise((resolve, _) => {
      blobToDataUrl(bill.image).then(dataUrl => {
        if (dataUrl) {
          cacheItem.image = dataUrl;
        }

        resolve(cacheItem);
      })
    });
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
      date: bill.date,
      categoryId: bill.categoryId,
      subCategoryId: bill.subCategoryId,
      price: bill.price,
      notes: bill.notes,
      image: file
    }
  }
}
