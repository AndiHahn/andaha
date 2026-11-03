import { Injectable } from '@angular/core';
import { BillCreateDto } from '../../../api/shopping/dtos/BillCreateDto';

const DB_NAME = 'andaha';
const DB_VERSION = 1;
const STORE_NAME = 'pendingBills';

@Injectable({
  providedIn: 'root'
})
export class PendingBillStore {
  private db?: Promise<IDBDatabase>;

  public getAll(): Promise<BillCreateDto[]> {
    return this.run<BillCreateDto[]>('readonly', store => store.getAll());
  }

  public put(bill: BillCreateDto): Promise<void> {
    return this.run<void>('readwrite', store => store.put(bill));
  }

  public delete(id: string): Promise<void> {
    return this.run<void>('readwrite', store => store.delete(id));
  }

  private open(): Promise<IDBDatabase> {
    if (!this.db) {
      const opening = new Promise<IDBDatabase>((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
          reject(new Error('IndexedDB is not available'));
          return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
        };
        request.onsuccess = () => {
          const db = request.result;
          // Mobile browsers may close the connection when the PWA is backgrounded.
          db.onclose = () => this.db = undefined;
          db.onversionchange = () => {
            db.close();
            this.db = undefined;
          };
          resolve(db);
        };
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error('IndexedDB open blocked'));
      });

      // Allow a retry on the next call when opening failed.
      opening.catch(() => this.db = undefined);
      this.db = opening;
    }

    return this.db;
  }

  private async run<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest): Promise<T> {
    try {
      return await this.runOnce<T>(mode, operation);
    } catch (error) {
      if ((error as DOMException | undefined)?.name !== 'InvalidStateError') {
        throw error;
      }

      // The cached connection was closed by the browser: retry once with a fresh one.
      this.db = undefined;
      return await this.runOnce<T>(mode, operation);
    }
  }

  private async runOnce<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest): Promise<T> {
    const db = await this.open();

    return new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const request = operation(transaction.objectStore(STORE_NAME));
      transaction.oncomplete = () => resolve(mode === 'readonly' ? request.result : undefined);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
    });
  }
}
