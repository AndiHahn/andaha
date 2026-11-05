import { BillCreateDto } from '../../../api/shopping/dtos/BillCreateDto';
import { PendingBillStore } from './pending-bill-store.service';

function createBill(id: string): BillCreateDto {
    return { id, shopName: 'Shop', categoryId: 'cat', price: 1, date: new Date(2024, 0, 2) };
}

describe('PendingBillStore', () => {
    let store: PendingBillStore;

    async function openConnection(): Promise<IDBDatabase> {
        return (store as any).open() as Promise<IDBDatabase>;
    }

    beforeEach(async () => {
        store = new PendingBillStore();
        await store.put(createBill('seed'));
        await store.delete('seed');
    });

    afterEach(async () => {
        const db = await openConnection();
        db.close();
        await new Promise<void>(resolve => {
            const request = indexedDB.deleteDatabase('andaha');
            request.onsuccess = () => resolve();
            request.onerror = () => resolve();
            request.onblocked = () => resolve();
        });
    });

    it('clear removes all pending bills', async () => {
        await store.put(createBill('a'));
        await store.put(createBill('b'));

        await store.clear();

        expect(await store.getAll()).toEqual([]);
    });

    it('stores, lists and deletes bills', async () => {
        await store.put(createBill('a'));
        expect((await store.getAll()).map(b => b.id)).toEqual(['a']);

        await store.delete('a');
        expect(await store.getAll()).toEqual([]);
    });

    it('stores and returns a bill with an image blob', async () => {
        const image = new File([new Uint8Array([1, 2, 3, 4, 5])], 'photo.jpg', { type: 'image/jpeg' });
        await store.put({ ...createBill('img'), image } as BillCreateDto);

        const [stored] = await store.getAll();

        expect(stored.image instanceof Blob).toBe(true);
        expect((stored.image as Blob).size).toBe(image.size);
    });

    it('reopens the connection after onclose', async () => {
        const db = await openConnection();

        db.onclose!(new Event('close'));

        expect((store as any).db).toBeUndefined();
        await store.put(createBill('a'));
        expect((await openConnection())).not.toBe(db);
        expect((await store.getAll()).length).toBe(1);
    });

    it('closes and reopens the connection after onversionchange', async () => {
        const db = await openConnection();
        const closeSpy = vi.spyOn(db, 'close');

        db.onversionchange!(new Event('versionchange') as IDBVersionChangeEvent);

        expect(closeSpy).toHaveBeenCalled();
        expect((store as any).db).toBeUndefined();
        await store.put(createBill('a'));
        expect((await store.getAll()).length).toBe(1);
    });

    it('retries once with a fresh connection on InvalidStateError', async () => {
        const db = await openConnection();
        db.close();

        await store.put(createBill('a'));

        expect((await openConnection())).not.toBe(db);
        expect((await store.getAll()).map(b => b.id)).toEqual(['a']);
    });

    it('does not retry other errors', async () => {
        const db = await openConnection();
        vi.spyOn(db, 'transaction').mockImplementation(() => {
            throw new Error('boom');
        });

        await expect(store.getAll()).rejects.toThrowError('boom');
        expect(db.transaction).toHaveBeenCalledTimes(1);
    });
});
