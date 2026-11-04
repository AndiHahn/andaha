import type { MockedObject } from "vitest";
import { TestBed } from '@angular/core/testing';
import { BillCreateDto } from '../../../api/shopping/dtos/BillCreateDto';
import { BillCacheService } from './bill-cache.service';
import { PendingBillStore } from './pending-bill-store.service';

const LEGACY_KEY = 'Bills|New';
const PIXEL_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function createBill(id: string, image?: File): BillCreateDto {
    return { id, shopName: 'Shop', categoryId: 'cat', price: 1, date: new Date(2024, 0, 2), image };
}

describe('BillCacheService', () => {
    let bills: Map<string, BillCreateDto>;
    let store: MockedObject<PendingBillStore>;

    function createService(): BillCacheService {
        TestBed.configureTestingModule({ providers: [{ provide: PendingBillStore, useValue: store }] });
        return TestBed.inject(BillCacheService);
    }

    beforeEach(() => {
        localStorage.removeItem(LEGACY_KEY);
        bills = new Map();
        store = {
            getAll: vi.fn().mockName("PendingBillStore.getAll"),
            put: vi.fn().mockName("PendingBillStore.put"),
            delete: vi.fn().mockName("PendingBillStore.delete")
        } as unknown as MockedObject<PendingBillStore>;
        store.getAll.mockImplementation(() => Promise.resolve(Array.from(bills.values())));
        store.put.mockImplementation(bill => { bills.set(bill.id, bill); return Promise.resolve(); });
        store.delete.mockImplementation(id => { bills.delete(id); return Promise.resolve(); });
    });

    afterEach(() => localStorage.removeItem(LEGACY_KEY));

    it('saveNewBillLocal stores bill and emits billAdded', async () => {
        const service = createService();
        let emitted = 0;
        service.billAdded().subscribe(() => emitted++);
        const image = new File([new Blob(['x'])], 'image', { type: 'image/png' });

        await service.saveNewBillLocal(createBill('a', image));

        expect(bills.has('a')).toBe(true);
        expect(emitted).toBe(1);
        expect((await service.getBillsToSync()).length).toBe(1);
    });

    it('saveNewBillLocal rejects when store put fails', async () => {
        const service = createService();
        let emitted = 0;
        service.billAdded().subscribe(() => emitted++);
        store.put.mockRejectedValue(new Error('quota'));

        await expect(service.saveNewBillLocal(createBill('a'))).rejects.toThrow();

        expect(emitted).toBe(0);
    });

    it('migrates legacy localStorage bills with image', async () => {
        localStorage.setItem(LEGACY_KEY, JSON.stringify([{ ...createBill('legacy'), image: PIXEL_PNG }]));
        const service = createService();

        const result = await service.getBillsToSync();

        expect(result.length).toBe(1);
        expect(result[0].image instanceof Blob).toBe(true);
        expect(result[0].date instanceof Date).toBe(true);
        expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
    });

    it('keeps legacy key when json is corrupt', async () => {
        localStorage.setItem(LEGACY_KEY, '{kaputt');
        const service = createService();

        expect(await service.getBillsToSync()).toEqual([]);
        expect(localStorage.getItem(LEGACY_KEY)).toBe('{kaputt');
    });

    it('keeps legacy key when store write fails', async () => {
        localStorage.setItem(LEGACY_KEY, JSON.stringify([{ ...createBill('legacy'), image: PIXEL_PNG }]));
        store.put.mockRejectedValue(new Error('quota'));
        const service = createService();

        await service.getBillsToSync();

        expect(localStorage.getItem(LEGACY_KEY)).not.toBeNull();
    });

    it('migrates remaining legacy bills when one entry is malformed but keeps the legacy key', async () => {
        const bad = { ...createBill('bad'), image: 'not-a-data-url' };
        const good = { ...createBill('good'), image: PIXEL_PNG };
        localStorage.setItem(LEGACY_KEY, JSON.stringify([bad, good]));
        const service = createService();

        const result = await service.getBillsToSync();

        expect(result.map(b => b.id)).toEqual(['good']);
        const remaining = JSON.parse(localStorage.getItem(LEGACY_KEY)!);
        expect(remaining.map((b: {
            id: string;
        }) => b.id)).toEqual(['bad']);
    });

    it('removeBillLocal deletes entry', async () => {
        const service = createService();
        await service.saveNewBillLocal(createBill('a'));

        await service.removeBillLocal('a');

        expect(bills.has('a')).toBe(false);
        expect(await service.getBillsToSync()).toEqual([]);
    });
});
