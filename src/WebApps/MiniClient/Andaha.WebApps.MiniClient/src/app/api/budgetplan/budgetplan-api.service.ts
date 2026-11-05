import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { constructPath, constructVersionedPath } from '../functions/functions';
import { BudgetPlanDto } from './dtos/BudgetPlanDto';
import { BudgetPlanSettingsDto } from './dtos/BudgetPlanSettingsDto';
import { skipGlobalError } from 'src/app/core/http/skip-global-error';

@Injectable({
  providedIn: 'root'
})
export class BudgetPlanApiService {
  private httpClient = inject(HttpClient);

  private endpointUrl: string;
  private apiVersion: string = '1.0';

  constructor() {
    if (environment.useMonolithApi) {
      this.endpointUrl = constructPath(environment.monolithApiBaseUrl, 'api');
    } else if (environment.useGateway) {
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

  getBudgetPlanSettings(): Observable<BudgetPlanSettingsDto> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'budgetplan', 'settings');

    return this.httpClient.get<BudgetPlanSettingsDto>(url);
  }

  /** Lebenserhaltungs-Anteil in ganzen Prozent (0–100). Der Aufrufer zeigt bei Fehlern eine eigene Meldung. */
  updateBudgetPlanSettings(livingCostShare: number): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'budgetplan', 'settings');

    return this.httpClient.put<void>(url, { livingCostShare }, skipGlobalError());
  }

  /** Löscht alle Haushaltsdaten des Benutzers inkl. Historie (AC31). Der Aufrufer zeigt bei Fehlern eine eigene Meldung. */
  deleteUserData(): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'budgetplan', 'user-data');

    return this.httpClient.delete<void>(url, skipGlobalError());
  }
}
