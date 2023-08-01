import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { constructPath, constructVersionedPath } from '../functions/functions';
import { IncomeCreateDto } from './dtos/IncomeCreateDto';
import { IncomeDto } from './dtos/IncomeDto';
import { IncomeHistoryDto, RawIncomeHistoryDto } from './dtos/IncomeHistoryDto';
import { IncomeUpdateDto } from './dtos/IncomeUpdateDto';
import { mapIncomeHistoryList } from './pipes/income-history-pipe';

@Injectable({
  providedIn: 'root'
})
export class IncomeApiService {
  private endpointUrl: string;
  private apiVersion: string = "1.0";

  constructor(private httpClient: HttpClient) {
    if (environment.useMonolithApi) {
      this.endpointUrl = constructPath(environment.monolithApiBaseUrl, 'api', 'income');
    } else if (environment.useGateway) {
      this.endpointUrl = constructPath(environment.gatewayBaseUrl, 'budgetplan-api', 'income');
    } else {
      this.endpointUrl = 'https://localhost:8400/api/income';
    }
  }

  list(): Observable<IncomeDto[]> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl);

    return this.httpClient.get<IncomeDto[]>(url);
  }

  history(id: string): Observable<IncomeHistoryDto[]> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, id, 'history');

    return this.httpClient.get<RawIncomeHistoryDto[]>(url)
      .pipe(map(mapIncomeHistoryList));
  }

  create(createDto: IncomeCreateDto): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl);

    return this.httpClient.post<void>(url, createDto);
  }

  update(id: string, updateDto: IncomeUpdateDto): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, id);

    return this.httpClient.put<void>(url, updateDto);
  }

  delete(id: string): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, id);

    return this.httpClient.delete<void>(url);
  }
}
