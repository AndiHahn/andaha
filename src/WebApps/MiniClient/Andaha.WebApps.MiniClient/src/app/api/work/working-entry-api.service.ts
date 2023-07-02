import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { constructPath, constructVersionedPath } from '../functions/functions';
import { Observable, map } from 'rxjs';
import { WorkingEntryDto, WorkingEntryDtoRaw, mapWorkingEntryDtoRawList } from './dtos/WorkingEntryDto';
import { CreateWorkingEntryDto } from './dtos/CreateWorkingEntryDto';
import { CreateWorkingEntriesDto } from './dtos/CreateWorkingEntriesDto';
import { UpdateWorkingEntryDto } from './dtos/UpdateWorkingEntryDto';

@Injectable({
  providedIn: 'root'
})
export class WorkingEntryApiService {
  private endpointUrl: string;
  private apiVersion: string = "1.0";

  constructor(private httpClient: HttpClient) {
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

  createWorkingEntry(dto: CreateWorkingEntryDto): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl);

    return this.httpClient.post<void>(url, dto);
  }

  createWorkingEntries(dto: CreateWorkingEntriesDto): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'bulk');

    return this.httpClient.post<void>(url, dto);
  }

  updateWorkingEntry(id: string, dto: UpdateWorkingEntryDto): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, id);

    return this.httpClient.put<void>(url, dto);
  }

  deleteWorkingEntry(id: string): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, id);
    
    return this.httpClient.delete<void>(url);
  }
}
