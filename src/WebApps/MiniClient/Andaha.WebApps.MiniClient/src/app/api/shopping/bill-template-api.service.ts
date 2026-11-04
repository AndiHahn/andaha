import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { constructPath, constructVersionedPath } from '../functions/functions';
import { BillSuggestionDto, BillSuggestionKey } from './dtos/BillSuggestionDto';
import { BillTemplateCreateDto, BillTemplateDto } from './dtos/BillTemplateDto';

@Injectable({
  providedIn: 'root'
})
export class BillTemplateApiService {
  private httpClient = inject(HttpClient);

  private endpointUrl: string;
  private apiVersion: string = "1.0";

  constructor() {
    if (environment.useMonolithApi) {
      this.endpointUrl = constructPath(environment.monolithApiBaseUrl, 'api', 'bill-template');
    } else if (environment.useGateway) {
      this.endpointUrl = constructPath(environment.gatewayBaseUrl, 'shopping-api', 'bill-template');
    } else {
      this.endpointUrl = 'https://localhost:8200/api/bill-template';
    }
  }

  list(): Observable<BillTemplateDto[]> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl);
    return this.httpClient.get<BillTemplateDto[]>(url);
  }

  create(dto: BillTemplateCreateDto): Observable<BillTemplateDto> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl);
    return this.httpClient.post<BillTemplateDto>(url, dto);
  }

  update(id: string, dto: BillTemplateCreateDto): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, id);
    return this.httpClient.put<void>(url, { ...dto, id });
  }

  delete(id: string): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, id);
    return this.httpClient.delete<void>(url);
  }

  updateOrder(ids: string[]): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'order');
    return this.httpClient.put<void>(url, { ids });
  }

  suggestions(): Observable<BillSuggestionDto[]> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'suggestions');
    return this.httpClient.get<BillSuggestionDto[]>(url);
  }

  hideSuggestion(s: BillSuggestionKey): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'hidden-suggestions');
    return this.httpClient.post<void>(url, {
      shopName: s.shopName,
      categoryId: s.categoryId,
      subCategoryId: s.subCategoryId ?? null
    });
  }
}
