import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BudgetPlanApiService } from './budgetplan-api.service';

describe('BudgetPlanApiService settings', () => {
  let http: HttpTestingController;
  let api: BudgetPlanApiService;

  const settingsRequest = (method: string) =>
    http.expectOne(r => r.method === method && new URL(r.url).pathname === '/api/budgetplan/settings');

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(BudgetPlanApiService);
  });

  afterEach(() => http.verify());

  it('getBudgetPlanSettings: GET api/budgetplan/settings', () => {
    let share: number | undefined;
    api.getBudgetPlanSettings().subscribe(s => share = s.livingCostShare);
    settingsRequest('GET').flush({ livingCostShare: 35 });
    expect(share).toBe(35);
  });

  it('updateBudgetPlanSettings: PUT api/budgetplan/settings with livingCostShare', () => {
    api.updateBudgetPlanSettings(40).subscribe();
    const req = settingsRequest('PUT');
    expect(req.request.body).toEqual({ livingCostShare: 40 });
    req.flush(null);
  });
});
