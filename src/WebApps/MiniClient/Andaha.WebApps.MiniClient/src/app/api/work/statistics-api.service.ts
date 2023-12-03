import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { constructPath, constructVersionedPath } from '../functions/functions';
import { StatisticsDto, StatisticsDtoRaw, mapStatisticsDtoRaw } from './dtos/StatisticsDto';
import { Observable, map } from 'rxjs';
import { GetStatisticsParameters } from './dtos/GetStatisticsParameters';
import { TimeRangeDto, TimeRangeDtoRaw, mapTimeRangeDtoRaw } from '../common-dtos/TimeRangeDto';
import { DatePipe } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class StatisticsApiService {
  private endpointUrl: string;
  private apiVersion: string = "1.0";

  constructor(
    private datePipe: DatePipe,
    private httpClient: HttpClient) {
    if (environment.useMonolithApi) {
      this.endpointUrl = constructPath(environment.monolithApiBaseUrl, 'api', 'work-statistics');
    } else if (environment.useGateway) {
      this.endpointUrl = constructPath(environment.gatewayBaseUrl, 'work-api', 'work-statistics');
    } else {
      this.endpointUrl = 'https://localhost:8200/api/work-statistics';
    }
  }

  getAvailableTimeRange(): Observable<TimeRangeDto> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'time-range');

    return this.httpClient
      .get<TimeRangeDtoRaw>(url)
      .pipe(map(mapTimeRangeDtoRaw));
  }

  getStatistics(
    startTimeUtc: Date,
    endTimeUtc: Date,
    personFilter?: string[]
  ): Observable<StatisticsDto> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl);

    const parameters: GetStatisticsParameters = {
      startTimeUtc:  this.datePipe.transform(startTimeUtc, 'yyyy-MM-ddTHH:mm:ssZZZZZ')!,
      endTimeUtc: this.datePipe.transform(endTimeUtc, 'yyyy-MM-ddTHH:mm:ssZZZZZ')!,
      test: 25,
      personFilter: personFilter
    }

    return this.httpClient
      .post<StatisticsDtoRaw>(url, parameters)
      .pipe(map(mapStatisticsDtoRaw));
  }
}
