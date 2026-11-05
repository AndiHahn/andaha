import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { BillCacheService } from '../features/bill/services/bill-cache.service';
import { BillContextService } from '../features/bill/services/bill-context.service';
import { BudgetplanContextService } from '../features/budgetplan/services/budgetplan-context.service';
import { FixedCostContextService } from '../features/budgetplan/services/fixed-cost-context.service';
import { PersonContextService } from '../features/work/services/person-context.service';
import { CollaborationContextService } from '../services/collaboration-context.service';
import { AuthService } from './auth.service';

/** Offline-Start bzw. Backend nicht erreichbar: Listen zeigen den Fehler mit „Erneut versuchen“, nicht leer (AC34) */
describe('Lists when the backend wake-up fails (AC34)', () => {
  let http: HttpTestingController;

  const path = (url: string) => new URL(url).pathname;
  const isPing = (r: { url: string }) => path(r.url).endsWith('/ping');
  const pings = (): TestRequest[] => http.match(isPing);
  const others = (): TestRequest[] => http.match(r => !isPing(r));
  const offline = (requests: TestRequest[]) => requests.forEach(r => r.error(new ProgressEvent('error')));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { loggedIn: () => of(true) } },
        {
          provide: BillCacheService,
          useValue: { billAdded: () => new Subject<void>(), getBillsToSync: () => Promise.resolve([]) }
        }
      ]
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('bill list and budget plan wait for the backend instead of showing an empty list', () => {
    const bills = TestBed.inject(BillContextService);
    const budgetPlan = TestBed.inject(BudgetplanContextService);
    budgetPlan.budgetPlan().subscribe();
    offline(others());

    expect(bills.waitingForBackend()).toBe(true);
    expect(bills.error()).toBe(false);
    expect(budgetPlan.error()).toBe(false);
  });

  it('wake-up fails: lists show the error state, retry wakes the backend up again', () => {
    const bills = TestBed.inject(BillContextService);
    const budgetPlan = TestBed.inject(BudgetplanContextService);
    const fixedCosts = TestBed.inject(FixedCostContextService);
    const persons = TestBed.inject(PersonContextService);
    const collaboration = TestBed.inject(CollaborationContextService);
    budgetPlan.budgetPlan().subscribe();
    offline(others());

    offline(pings());

    expect(bills.waitingForBackend()).toBe(false);
    expect(bills.error()).toBe(true);
    expect(budgetPlan.error()).toBe(true);
    expect(fixedCosts.error()).toBe(true);
    expect(persons.error()).toBe(true);
    expect(collaboration.connectionsError()).toBe(true);

    bills.retry();

    expect(bills.error()).toBe(false);
    expect(budgetPlan.error()).toBe(false);
    expect(pings().length).toBe(4);
  });

  it('online event: wake-up is retried and the data loads', () => {
    const bills = TestBed.inject(BillContextService);
    const budgetPlan = TestBed.inject(BudgetplanContextService);
    budgetPlan.budgetPlan().subscribe();
    offline(others());
    offline(pings());
    expect(bills.error()).toBe(true);

    window.dispatchEvent(new Event('online'));
    pings().forEach(r => r.flush(null));

    const search = http.match(r => r.method === 'GET' && path(r.url).endsWith('/bill'));
    expect(search.length).toBeGreaterThan(0);
    search.forEach(r => r.flush({ values: [], totalCount: 0, totalSum: 0, monthSums: [] }));
    const plan = http.match(r => r.method === 'GET' && path(r.url).endsWith('/budgetplan'));
    expect(plan.length).toBe(1);
    plan[0].flush({ income: 1000, expenses: [] });

    expect(bills.error()).toBe(false);
    expect(bills.waitingForBackend()).toBe(false);
    expect(budgetPlan.error()).toBe(false);
    let loaded: unknown;
    budgetPlan.budgetPlan().subscribe(value => loaded = value);
    expect(loaded).toEqual({ income: 1000, expenses: [] });
  });
});
