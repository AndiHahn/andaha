import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { skipGlobalError } from 'src/app/core/http/skip-global-error';
import { createHttpParameters } from '../functions/api-utils';
import { constructPath, constructVersionedPath } from '../functions/functions';
import { ExpenseDto } from './dtos/ExpenseDto';
import { MonthlyCostsDto } from './dtos/MonthlyCostsDto';
import { mapAvailableBillTimeRangeDtoRaw, TimeRangeDto, TimeRangeDtoRaw } from '../common-dtos/TimeRangeDto';

@Injectable({
  providedIn: 'root'
})
export class ExpenseApiService {
  private httpClient = inject(HttpClient);

  private endpointUrl: string;
  private apiVersion: string = "1.0";

  constructor() {
    if (environment.useMonolithApi) {
      this.endpointUrl = constructPath(environment.monolithApiBaseUrl, 'api', 'expense');
    } else if (environment.useGateway) {
      this.endpointUrl = constructPath(environment.gatewayBaseUrl, 'shopping-api', 'expense');
    } else {
      this.endpointUrl = 'https://localhost:8200/api/expense';
    }
  }

  getExpenses(timeRange: TimeRangeDtoRaw): Observable<ExpenseDto[]> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl);

    const httpParameters = createHttpParameters([
      { key: 'startTimeUtc', value: timeRange.startTimeUtc.toString() },
      { key: 'endTimeUtc', value: timeRange.endTimeUtc.toString() }
    ]);

    return this.httpClient.get<ExpenseDto[]>(url, { params: httpParameters});
  }

  /** Zeitraum aller eigenen und verbundenen Rechnungen; null für ein Konto ohne Rechnungen */
  getAvailableTimeRange(): Observable<TimeRangeDto | null> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'time-range');

    return this.httpClient.get<TimeRangeDtoRaw>(url)
      .pipe(map(mapAvailableBillTimeRangeDtoRaw));
  }

  /**
   * Export als Datei. `start`/`end` zählen als lokale Kalendertage; `categoryNames` filtert nach
   * Kategorie-Namen (wiederholter Query-Parameter `categoryFilter`), leer oder weggelassen heißt alle.
   */
  exportExpenses(start: Date, end: Date, categoryNames?: string[]): Observable<HttpResponse<Blob>> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'export');

    const httpParameters = createHttpParameters([
      { key: 'startTimeUtc', value: formatUsDate(start) },
      { key: 'endTimeUtc', value: formatUsDate(end) },
      ...(categoryNames ?? []).map(name => ({ key: 'categoryFilter', value: name }))
    ]);

    return this.httpClient
      // Der Export zeigt bei Fehlern eine eigene Snackbar (SKIP_GLOBAL_ERROR)
      .get(url, { params: httpParameters, responseType: 'blob' as 'blob', observe: 'response', ...skipGlobalError() });
  }

  /** Ausgaben je Monat ("yyyy-MM"), aufsteigend, `months` Monate bis einschließlich `until` */
  getMonthlyExpenses(until: string, months: number): Observable<MonthlyCostsDto[]> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'monthly');

    const httpParameters = createHttpParameters([
      { key: 'until', value: until },
      { key: 'months', value: months.toString() }
    ]);

    return this.httpClient.get<MonthlyCostsDto[]>(url, { params: httpParameters });
  }
}


/** Lokaler Kalendertag als MM/dd/yyyy, wie bisher per DatePipe an den Export-Endpoint gesendet */
function formatUsDate(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()}`;
}
