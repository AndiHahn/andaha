import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { constructPath, constructVersionedPath } from '../functions/functions';
import { BillSuggestionDto, BillSuggestionKey } from './dtos/BillSuggestionDto';
import { BillTemplateCreateDto, BillTemplateDto } from './dtos/BillTemplateDto';
import { HiddenBillSuggestionDto } from './dtos/HiddenBillSuggestionDto';
import { skipGlobalError } from 'src/app/core/http/skip-global-error';

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

  // Ändernde Aufrufe: jeder Aufrufer zeigt bei Fehlern eine eigene Snackbar (SKIP_GLOBAL_ERROR)

  create(dto: BillTemplateCreateDto): Observable<BillTemplateDto> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl);
    return this.httpClient.post<BillTemplateDto>(url, dto, skipGlobalError());
  }

  update(id: string, dto: BillTemplateCreateDto): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, id);
    return this.httpClient.put<void>(url, { ...dto, id }, skipGlobalError());
  }

  delete(id: string): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, id);
    return this.httpClient.delete<void>(url, skipGlobalError());
  }

  updateOrder(ids: string[]): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'order');
    return this.httpClient.put<void>(url, { ids }, skipGlobalError());
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
    }, skipGlobalError());
  }

  /** Ausgeblendete Vorschläge, sortiert nach Shop und Kategorie */
  listHiddenSuggestions(): Observable<HiddenBillSuggestionDto[]> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'hidden-suggestions');
    return this.httpClient.get<HiddenBillSuggestionDto[]>(url);
  }

  /** „Wieder anzeigen“. Der Aufrufer zeigt bei Fehlern eine eigene Meldung. */
  unhideSuggestion(id: string): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'hidden-suggestions', id);
    return this.httpClient.delete<void>(url, skipGlobalError());
  }
}
