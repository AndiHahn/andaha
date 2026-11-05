import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { constructPath, constructVersionedPath } from '../functions/functions';
import { Observable, map } from 'rxjs';
import { WorkingEntryDto, WorkingEntryDtoRaw, mapWorkingEntryDtoRawList } from './dtos/WorkingEntryDto';
import { CreateWorkingEntryDto } from './dtos/CreateWorkingEntryDto';
import { CreateWorkingEntriesDto } from './dtos/CreateWorkingEntriesDto';
import { UpdateWorkingEntryDto } from './dtos/UpdateWorkingEntryDto';
import { WorkingEntryMonthsDto, WorkingEntryMonthsDtoRaw, mapWorkingEntryMonthsDtoRaw } from './dtos/WorkingEntryMonthsDto';
import { createHttpParameters } from '../functions/api-utils';
import { currentTimeZone } from 'src/app/shared/utils/time-zone';
import { skipGlobalError } from 'src/app/core/http/skip-global-error';

@Injectable({
  providedIn: 'root'
})
export class WorkingEntryApiService {
  private httpClient = inject(HttpClient);

  private endpointUrl: string;
  private apiVersion: string = "1.0";

  constructor() {
    if (environment.useMonolithApi) {
      this.endpointUrl = constructPath(environment.monolithApiBaseUrl, 'api', 'working-entry');
    } else if (environment.useGateway) {
      this.endpointUrl = constructPath(environment.gatewayBaseUrl, 'work-api', 'working-entry');
    } else {
      this.endpointUrl = 'https://localhost:8200/api/working-entry';
    }
  }

  listWorkingEntries(personId: string): Observable<WorkingEntryDto[]> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, personId);

    return this.httpClient.get<WorkingEntryDtoRaw[]>(url).pipe(map(mapWorkingEntryDtoRawList));
  }

  /**
   * Arbeitszeiten ganzer lokaler Monate, neueste zuerst: `months` Monate mit Einträgen bis einschließlich
   * `until` ("yyyy-MM"; ohne `until` ab dem neuesten Eintrag). `nextUntil` ist der Startwert für
   * „Ältere Monate laden“, `null` wenn es keine älteren gibt.
   */
  listWorkingEntryMonths(personId: string, until?: string, months = 3): Observable<WorkingEntryMonthsDto> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, personId, 'months');

    const httpParameters = createHttpParameters([
      ...(until ? [{ key: 'until', value: until }] : []),
      { key: 'months', value: months.toString() },
      { key: 'tz', value: currentTimeZone() }
    ]);

    return this.httpClient.get<WorkingEntryMonthsDtoRaw>(url, { params: httpParameters })
      .pipe(map(mapWorkingEntryMonthsDtoRaw));
  }

  // Ändernde Aufrufe: Erfassen und Detail-Dialog zeigen bei Fehlern eine eigene Snackbar (SKIP_GLOBAL_ERROR)

  createWorkingEntry(dto: CreateWorkingEntryDto): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl);

    return this.httpClient.post<void>(url, dto, skipGlobalError());
  }

  createWorkingEntries(dto: CreateWorkingEntriesDto): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'bulk');

    return this.httpClient.post<void>(url, dto, skipGlobalError());
  }

  updateWorkingEntry(id: string, dto: UpdateWorkingEntryDto): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, id);

    return this.httpClient.put<void>(url, dto, skipGlobalError());
  }

  deleteWorkingEntry(id: string): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, id);
    
    return this.httpClient.delete<void>(url, skipGlobalError());
  }
}
