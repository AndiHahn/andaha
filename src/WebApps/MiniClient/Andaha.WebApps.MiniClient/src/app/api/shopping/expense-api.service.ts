import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { createHttpParameters } from '../functions/api-utils';
import { constructPath, constructVersionedPath } from '../functions/functions';
import { ExpenseDto } from './dtos/ExpenseDto';
import { mapTimeRangeDtoRaw, TimeRangeDto, TimeRangeDtoRaw } from '../common-dtos/TimeRangeDto';

@Injectable({
  providedIn: 'root'
})
export class ExpenseApiService {
  private endpointUrl: string;
  private apiVersion: string = "1.0";

  constructor(private httpClient: HttpClient) {
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

  getAvailableTimeRange(): Observable<TimeRangeDto> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'time-range');

    return this.httpClient.get<TimeRangeDtoRaw>(url)
      .pipe(map(mapTimeRangeDtoRaw));
  }

  exportExpenses(timeRange: TimeRangeDtoRaw): Observable<HttpResponse<Blob>> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'export');

    const httpParameters = createHttpParameters([
      { key: 'startTimeUtc', value: timeRange.startTimeUtc.toString() },
      { key: 'endTimeUtc', value: timeRange.endTimeUtc.toString() }
    ]);

    return this.httpClient
      .get(url, { params: httpParameters, responseType: 'blob' as 'blob', observe: 'response'});
  }
}
