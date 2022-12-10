import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { constructPath, constructVersionedPath } from '../functions/functions';
import { BudgetPlanDto } from './dtos/BudgetPlanDto';

@Injectable({
  providedIn: 'root'
})
export class BudgetPlanApiService {
  private endpointUrl: string;
  private apiVersion: string = '1.0';

  constructor(private httpClient: HttpClient) {
    if (environment.useMonolithApi) {
      this.endpointUrl = constructPath(environment.monolithApiBaseUrl, 'api');
    } else if (environment.dapr) {
      this.endpointUrl = constructPath(environment.gatewayBaseUrl, 'budgetplan-api');
    } else {
      this.endpointUrl = 'https://localhost:8400/api';
    }
  }

  wakeUp(): Observable<void> {
    const url = constructPath(this.endpointUrl, 'ping');
    return this.httpClient.get<void>(url);
  }

  getBudgetPlan(): Observable<BudgetPlanDto> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'budgetplan');

    return this.httpClient.get<BudgetPlanDto>(url);
  }
}
