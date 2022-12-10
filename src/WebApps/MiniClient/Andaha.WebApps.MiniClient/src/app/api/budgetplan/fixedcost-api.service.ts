import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { constructPath, constructVersionedPath } from '../functions/functions';
import { FixedCostCreateDto } from './dtos/FixedCostCreateDto';
import { FixedCostDto } from './dtos/FixedCostDto';
import { FixedCostHistoryDto, RawFixedCostHistoryDto } from './dtos/FixedCostHistoryDto';
import { FixedCostUpdateDto } from './dtos/FixedCostUpdateDto';
import { mapFixedCostHistoryList } from './pipes/fixed-cost-history-pipe';

@Injectable({
  providedIn: 'root'
})
export class FixedCostApiService {
  private endpointUrl: string;
  private apiVersion: string = "1.0";

  constructor(private httpClient: HttpClient) {
    if (environment.useMonolithApi) {
      this.endpointUrl = constructPath(environment.monolithApiBaseUrl, 'api', 'fixedcost');
    } else if (environment.useGateway) {
      this.endpointUrl = constructPath(environment.gatewayBaseUrl, 'budgetplan-api', 'fixedcost');
    } else {
      this.endpointUrl = 'https://localhost:8400/api/fixedcost';
    }
  }

  list(): Observable<FixedCostDto[]> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl);
    
    return this.httpClient.get<FixedCostDto[]>(url);
  }

  history(id: string): Observable<FixedCostHistoryDto[]> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, id, 'history');

    return this.httpClient.get<RawFixedCostHistoryDto[]>(url)
      .pipe(map(mapFixedCostHistoryList));
  }

  create(createDto: FixedCostCreateDto): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl);
    
    return this.httpClient.post<void>(url, createDto);
  }

  update(id: string, updateDto: FixedCostUpdateDto): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, id);

    return this.httpClient.put<void>(url, updateDto);
  }

  delete(id: string): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, id);

    return this.httpClient.delete<void>(url);
  }
}
