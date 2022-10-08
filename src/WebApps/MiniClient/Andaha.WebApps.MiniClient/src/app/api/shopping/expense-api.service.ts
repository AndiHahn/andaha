import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { createHttpParameters } from '../functions/api-utils';
import { addApiVersion, constructPath } from '../functions/functions';
import { ExpenseDto } from './dtos/ExpenseDto';
import { mapTimeRangeDtoRaw, TimeRangeDto, TimeRangeDtoRaw } from './dtos/TimeRangeDto';

@Injectable({
  providedIn: 'root'
})
export class ExpenseApiService {
  private endpointUrl: string;
  private apiVersion: string = "1.0";

  constructor(private httpClient: HttpClient) {
    if (environment.dapr) {
      this.endpointUrl = constructPath(environment.gatewayBaseUrl, 'shopping-api', 'expense');
    } else {
      this.endpointUrl = 'https://localhost:8200/api/expense';
    }
  }

  getExpenses(timeRange: TimeRangeDtoRaw): Observable<ExpenseDto[]> {
    const url = addApiVersion(this.endpointUrl, this.apiVersion);

    const httpParameters = createHttpParameters([
      { key: 'startTimeUtc', value: timeRange.startTimeUtc.toString() },
      { key: 'endTimeUtc', value: timeRange.endTimeUtc.toString() }
    ]);

    return this.httpClient.get<ExpenseDto[]>(url, { params: httpParameters});
  }

  getAvailableTimeRange(): Observable<TimeRangeDto> {
    const url = addApiVersion(constructPath(this.endpointUrl, 'time-range'), this.apiVersion);

    return this.httpClient.get<TimeRangeDtoRaw>(url)
      .pipe(map(mapTimeRangeDtoRaw));
  }
}