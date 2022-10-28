import { Injectable } from '@angular/core';
import { BillCreateDto } from '../api/shopping/dtos/BillCreateDto';

@Injectable({
  providedIn: 'root'
})
export class BillCacheService {

  private NEW_BILLS_CACHE_KEY: string = 'Bills|New';

  private currentlySyncing: BillCreateDto[] = [];

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

    return billsToSync;
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
    allBills.push(bill);

    localStorage.setItem(this.NEW_BILLS_CACHE_KEY, JSON.stringify(allBills));
  }

  private getSavedBills(): BillCreateDto[] {
    const billsJson = localStorage.getItem(this.NEW_BILLS_CACHE_KEY);
    if (!billsJson) {
      return [];
    }

    const bills: BillCreateDto[] = JSON.parse(billsJson);

    return bills;
  }
}
