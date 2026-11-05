import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { BillAnalyzedDto } from 'src/app/api/shopping/dtos/BillAnalyzedDto';
import { ContextService } from 'src/app/core/context.service';
import { AnalyzedBillContextService } from './analyzed-bill-context.service';

function analyzed(id: string): BillAnalyzedDto {
  return { id, shopName: id, imageAvailable: true, lineItems: [] };
}

describe('AnalyzedBillContextService', () => {
  let getAnalyzedBills: ReturnType<typeof vi.fn>;
  let service: AnalyzedBillContextService;

  beforeEach(() => {
    getAnalyzedBills = vi.fn(() => of([analyzed('a1'), analyzed('a2'), analyzed('a3')]));
    TestBed.configureTestingModule({
      providers: [
        { provide: BillApiService, useValue: { getAnalyzedBills } },
        { provide: ContextService, useValue: { backendUnreachable: () => false, backendReady: () => new BehaviorSubject(true) } }
      ]
    });
    service = TestBed.inject(AnalyzedBillContextService);
  });

  it('lädt alle offenen Analysen ohne Seitenparameter (AC36)', () => {
    expect(getAnalyzedBills).toHaveBeenCalled();
    for (const call of getAnalyzedBills.mock.calls) {
      expect(call.length).toBe(0);
    }
  });

  it('remove(id) nimmt den Eintrag sofort aus der Liste (Badge zählt herunter)', () => {
    let current: BillAnalyzedDto[] = [];
    service.bills().subscribe(bills => current = bills);
    expect(current.map(b => b.id)).toEqual(['a1', 'a2', 'a3']);

    service.remove('a2');

    expect(current.map(b => b.id)).toEqual(['a1', 'a3']);
    expect(service.getBillById('a2')).toBeUndefined();
  });
});
