import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { ContextService } from 'src/app/core/context.service';
import { BudgetplanContextService } from './budgetplan-context.service';
import { FixedCostContextService } from './fixed-cost-context.service';
import { IncomeContextService } from './income-context.service';

describe('BudgetplanContextService loading (AC38)', () => {
  let http: HttpTestingController;
  let backendReady: BehaviorSubject<boolean>;

  const path = (url: string) => new URL(url).pathname;
  const isGet = (resource: string) => (r: { method: string; url: string }) =>
    r.method === 'GET' && path(r.url).endsWith('/' + resource);
  const budgetPlanRequests = (): TestRequest[] => http.match(isGet('budgetplan'));
  const flushLists = () => {
    http.match(isGet('fixedcost')).forEach(r => r.flush([]));
    http.match(isGet('income')).forEach(r => r.flush([]));
  };

  beforeEach(() => {
    backendReady = new BehaviorSubject<boolean>(false);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ContextService, useValue: { backendReady: () => backendReady.asObservable(), retryWakeUp: vi.fn() } }
      ]
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('budget plan loads once on start and once per successful change', () => {
    const service = TestBed.inject(BudgetplanContextService);
    flushLists();
    expect(budgetPlanRequests().length).toBe(0);

    service.budgetPlan().subscribe();
    service.budgetPlan().subscribe();
    backendReady.next(true);
    backendReady.next(true);
    flushLists();

    const initial = budgetPlanRequests();
    expect(initial.length).toBe(1);
    initial[0].flush({ income: 1000, expenses: [] });

    TestBed.inject(FixedCostContextService).createFixedCost({} as never).subscribe();
    const create = http.expectOne(r => r.method === 'POST' && path(r.url).endsWith('/fixedcost'));
    expect(budgetPlanRequests().length).toBe(0);
    create.flush(null);
    flushLists();
    expect(budgetPlanRequests().length).toBe(1);

    TestBed.inject(IncomeContextService).updateIncome('i1', {} as never).subscribe();
    http.expectOne(r => r.method === 'PUT' && path(r.url).endsWith('/income/i1')).flush(null);
    flushLists();
    expect(budgetPlanRequests().length).toBe(1);

    TestBed.inject(FixedCostContextService).updateFixedCost('f1', {} as never).subscribe({ error: () => undefined });
    http.expectOne(r => r.method === 'PUT' && path(r.url).endsWith('/fixedcost/f1'))
      .flush('boom', { status: 400, statusText: 'Bad Request' });
    expect(budgetPlanRequests().length).toBe(0);
  });

  it('budget plan does not reload on optimistic delete before server response', () => {
    backendReady.next(true);
    const service = TestBed.inject(BudgetplanContextService);
    service.budgetPlan().subscribe();
    budgetPlanRequests().forEach(r => r.flush({ income: 1000, expenses: [] }));
    flushLists();

    const fixedCosts = TestBed.inject(FixedCostContextService);
    fixedCosts.deleteFixedCost('f1').subscribe();
    const deleteRequest = http.expectOne(r => r.method === 'DELETE' && path(r.url).endsWith('/fixedcost/f1'));
    expect(budgetPlanRequests().length).toBe(0);

    deleteRequest.flush(null);
    expect(budgetPlanRequests().length).toBe(1);

    TestBed.inject(IncomeContextService).deleteIncome('i1').subscribe({ error: () => undefined });
    http.expectOne(r => r.method === 'DELETE' && path(r.url).endsWith('/income/i1'))
      .flush('gone', { status: 404, statusText: 'Not Found' });
    expect(budgetPlanRequests().length).toBe(0);
  });

  it('does not load before anyone needs the budget plan', () => {
    backendReady.next(true);
    TestBed.inject(BudgetplanContextService);
    TestBed.inject(FixedCostContextService).createFixedCost({} as never).subscribe();
    http.expectOne(r => r.method === 'POST').flush(null);

    expect(budgetPlanRequests().length).toBe(0);
  });

  it('exposes error and retry reloads', () => {
    backendReady.next(true);
    const service = TestBed.inject(BudgetplanContextService);
    let plan: unknown;
    service.budgetPlan().subscribe(p => plan = p);

    budgetPlanRequests()[0].flush('boom', { status: 500, statusText: 'Server Error' });
    expect(service.error()).toBe(true);

    service.retry();
    expect(service.error()).toBe(false);
    budgetPlanRequests()[0].flush({ income: 1, expenses: [] });

    expect(service.error()).toBe(false);
    expect(plan).toEqual({ income: 1, expenses: [] });
  });
});
