import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { constructPath, constructVersionedPath } from '../functions/functions';
import { StatisticsDto, StatisticsDtoRaw, mapStatisticsDtoRaw } from './dtos/StatisticsDto';
import { Observable, map } from 'rxjs';
import { GetStatisticsParameters } from './dtos/GetStatisticsParameters';
import { TimeRangeDto, TimeRangeDtoRaw, mapAvailableTimeRangeDtoRaw } from '../common-dtos/TimeRangeDto';
import { DatePipe } from '@angular/common';
import { FullStatisticsDto, FullStatisticsDtoRaw, mapFullStatisticsDtoRaw } from './dtos/FullStatisticsDto';
import { MonthlyHoursDto } from './dtos/MonthlyHoursDto';
import { createHttpParameters } from '../functions/api-utils';
import { currentTimeZone } from 'src/app/shared/utils/time-zone';

@Injectable({
  providedIn: 'root'
})
export class StatisticsApiService {
  private datePipe = inject(DatePipe);
  private httpClient = inject(HttpClient);

  private endpointUrl: string;
  private apiVersion: string = "1.0";

  constructor() {
    if (environment.useMonolithApi) {
      this.endpointUrl = constructPath(environment.monolithApiBaseUrl, 'api', 'work-statistics');
    } else if (environment.useGateway) {
      this.endpointUrl = constructPath(environment.gatewayBaseUrl, 'work-api', 'work-statistics');
    } else {
      this.endpointUrl = 'https://localhost:8200/api/work-statistics';
    }
  }

  /** Zeitraum aller eigenen und verbundenen Arbeitszeiten; null für ein Konto ohne Arbeitszeiten */
  getAvailableTimeRange(): Observable<TimeRangeDto | null> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'time-range');

    return this.httpClient
      .get<TimeRangeDtoRaw>(url)
      .pipe(map(mapAvailableTimeRangeDtoRaw));
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
      personFilter: personFilter ?? []
    }

    return this.httpClient
      .post<StatisticsDtoRaw>(url, parameters)
      .pipe(map(mapStatisticsDtoRaw));
  }

  getFullStatistics(
    personFilter?: string[]
  ): Observable<FullStatisticsDto> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'full');

    return this.httpClient
      .get<FullStatisticsDtoRaw>(url, { params: personFilterParams(personFilter) })
      .pipe(map(mapFullStatisticsDtoRaw));
  }

  /** Stunden je lokalem Monat ("yyyy-MM"), aufsteigend, genau `months` Einträge bis einschließlich `until` */
  getMonthlyHours(until: string, months: number, personFilter?: string[]): Observable<MonthlyHoursDto[]> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'monthly');

    const params = personFilterParams(personFilter)
      .append('until', until)
      .append('months', months.toString())
      .append('tz', currentTimeZone());

    return this.httpClient.get<MonthlyHoursDto[]>(url, { params });
  }
}


/** Wiederholter Query-Parameter `personFilter`; leer heißt alle eigenen und verbundenen Personen */
function personFilterParams(personFilter?: string[]): HttpParams {
  return createHttpParameters((personFilter ?? []).map(id => ({ key: 'personFilter', value: id })));
}
