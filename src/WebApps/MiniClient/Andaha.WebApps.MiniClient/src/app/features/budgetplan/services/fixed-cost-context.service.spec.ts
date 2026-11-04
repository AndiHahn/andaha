import type { MockedObject } from "vitest";
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { FixedCostApiService } from 'src/app/api/budgetplan/fixedcost-api.service';
import { FixedCostDto } from 'src/app/api/budgetplan/dtos/FixedCostDto';
import { ContextService } from 'src/app/core/context.service';
import { FixedCostContextService } from './fixed-cost-context.service';

describe('FixedCostContextService byId', () => {
    beforeEach(() => {
        vi.useFakeTimers({ advanceTimeDelta: 1, shouldAdvanceTime: true });
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    let listRequest: Subject<FixedCostDto[]>;
    let backendReady: BehaviorSubject<boolean>;
    let api: MockedObject<FixedCostApiService>;

    const cost = { id: 'f1', name: 'Rent', value: 1 } as unknown as FixedCostDto;

    function createService(): FixedCostContextService {
        const contextService = {
            backendReady: vi.fn().mockName("ContextService.backendReady")
        };
        contextService.backendReady.mockReturnValue(backendReady.asObservable());
        return new FixedCostContextService(contextService as unknown as ContextService, api);
    }

    beforeEach(() => {
        backendReady = new BehaviorSubject<boolean>(false);
        listRequest = new Subject<FixedCostDto[]>();
        api = {
            list: vi.fn().mockName("FixedCostApiService.list")
        } as unknown as MockedObject<FixedCostApiService>;
        api.list.mockReturnValue(listRequest.asObservable());
    });

    it('waits for the initial load', () => {
        const service = createService();
        const emissions: (FixedCostDto | undefined)[] = [];
        let completed = false;

        service.byId('f1').subscribe({ next: c => emissions.push(c), complete: () => completed = true });
        expect(emissions.length).toBe(0);

        listRequest.next([cost]);

        expect(emissions).toEqual([cost]);
        expect(completed).toBe(true);
    });

    it('emits undefined when the initial load fails', () => {
        backendReady.next(true);
        api.list.mockReturnValue(throwError(() => new Error('offline')));
        const service = createService();
        let result: FixedCostDto | undefined = cost;
        let emitted = false;

        service.byId('f1').subscribe(c => { emitted = true; result = c; });

        expect(emitted).toBe(true);
        expect(result).toBeUndefined();
    });

    it('ignores a failure before the backend is ready and waits for the refetch', () => {
        api.list.mockReturnValueOnce(throwError(() => new Error('not ready'))).mockReturnValueOnce(of([cost]));
        const service = createService();
        const emissions: (FixedCostDto | undefined)[] = [];

        service.byId('f1').subscribe(c => emissions.push(c));
        expect(emissions.length).toBe(0);

        backendReady.next(true);

        expect(emissions).toEqual([cost]);
    });

    it('emits undefined after 10 s when offline and nothing loads', async () => {
        vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
        const service = createService();
        const emissions: (FixedCostDto | undefined)[] = [];
        let completed = false;

        service.byId('f1').subscribe({ next: c => emissions.push(c), complete: () => completed = true });
        await vi.advanceTimersByTimeAsync(9999);
        expect(emissions.length).toBe(0);

        await vi.advanceTimersByTimeAsync(1);

        expect(emissions).toEqual([undefined]);
        expect(completed).toBe(true);
    });

    it('emits undefined after 45 s when online and nothing loads', async () => {
        const service = createService();
        const emissions: (FixedCostDto | undefined)[] = [];
        let completed = false;

        service.byId('f1').subscribe({ next: c => emissions.push(c), complete: () => completed = true });
        await vi.advanceTimersByTimeAsync(44999);
        expect(emissions.length).toBe(0);

        await vi.advanceTimersByTimeAsync(1);

        expect(emissions).toEqual([undefined]);
        expect(completed).toBe(true);
    });

    it('emits undefined for an unknown id', () => {
        const service = createService();
        let result: FixedCostDto | undefined = cost;
        let emitted = false;
        listRequest.next([cost]);

        service.byId('nope').subscribe(c => { emitted = true; result = c; });

        expect(emitted).toBe(true);
        expect(result).toBeUndefined();
    });
});
