import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { getRecordOfProperties } from 'src/app/shared/utils/utils';
import { environment } from 'src/environments/environment';
import { skipGlobalError } from 'src/app/core/http/skip-global-error';
import { createHttpParameters } from '../functions/api-utils';
import { constructPath, constructVersionedPath } from '../functions/functions';
import { BillCreateDto } from './dtos/BillCreateDto';
import { BillDto, BillDtoRaw, mapBillDtoRaw } from './dtos/BillDto';
import { BillSearchResultDto, mapBillSearchResultDtoRaw } from './dtos/BillSearchResultDto';
import { BillUpdateDto } from './dtos/BillUpdateDto';
import { BillAnalyzedDto, BillAnalyzedDtoRaw, mapBillAnalyzedDtoRaw } from './dtos/BillAnalyzedDto';
import { AnalyzeBillResultDto } from './dtos/AnalyzeBillResultDto';
import { mapShopStatDtoRaw, ShopStatDto, ShopStatDtoRaw } from './dtos/ShopStatDto';
import { getSearchBillsHttpParams, SearchBillsParameters } from './dtos/SearchBillsParameters';

@Injectable({
  providedIn: 'root'
})
export class BillApiService {
  private httpClient = inject(HttpClient);

  private endpointUrl: string;
  private apiVersion: string = "1.0";

  constructor() {
    if (environment.useMonolithApi) {
      this.endpointUrl = constructPath(environment.monolithApiBaseUrl, 'api', 'bill');
    } else if (environment.useGateway) {
      this.endpointUrl = constructPath(environment.gatewayBaseUrl, 'shopping-api', 'bill');
    } else {
      this.endpointUrl = 'https://localhost:8200/api/bill';
    }
  }

  searchBills(parameters: SearchBillsParameters): Observable<BillSearchResultDto> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl);

    const httpParameters = createHttpParameters(getSearchBillsHttpParams(parameters));

    return this.httpClient.get<BillSearchResultDto<BillDtoRaw>>(url, { params: httpParameters})
      .pipe(map(mapBillSearchResultDtoRaw));
  }

  getBill(id: string): Observable<BillDto> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, id);

    return this.httpClient.get<BillDtoRaw>(url)
      .pipe(map(mapBillDtoRaw));
  }

  addBill(dto: BillCreateDto): Observable<BillDto> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl);

    const formData = new FormData();
    const createDtoData = getRecordOfProperties<BillCreateDto>(dto);
    for (const key in createDtoData) {
      if (createDtoData[key] == null) {
        continue; // sonst landet der Text "undefined" im Formular
      }
      formData.set(key, createDtoData[key]);
    }

    // Aufrufer melden Fehler selbst (Offline-Speicher bzw. Übernehmen aus der Analyse, Review Focus 5)
    return this.httpClient.post<BillDtoRaw>(url, formData, skipGlobalError())
      .pipe(map(mapBillDtoRaw));
  }

  updateBill(id: string, dto: BillUpdateDto): Observable<BillDto> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, id);

    const formData = new FormData();
    const updateDtoData = getRecordOfProperties<BillUpdateDto>(dto);
    for (const key in updateDtoData) {
      if (updateDtoData[key] == null) {
        continue;
      }
      formData.set(key, updateDtoData[key]);
    }

    return this.httpClient.put<BillDtoRaw>(url, formData, skipGlobalError())
      .pipe(map(mapBillDtoRaw));
  }

  deleteBill(id: string): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, id);

    return this.httpClient.delete<void>(url, skipGlobalError());
  }

  uploadImage(billId: string, file: File): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, billId, 'image');

    const formData = new FormData();
    formData.set('image', file);
    
    return this.httpClient.post<void>(url, formData);
  }

  downloadImage(billId: string) {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, billId, 'image');

    return this.httpClient.get(url, { responseType: 'blob' as 'blob', ...skipGlobalError() });
  }

  deleteImage(billId: string): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, billId, 'image');

    return this.httpClient.delete<void>(url, skipGlobalError());
  }

  uploadForAnalysis(file: File): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'upload-for-analysis');

    const formData = new FormData();
    formData.set('file', file);

    return this.httpClient.post<void>(url, formData);
  }

  downloadAnalyzedBillImage(id: string) {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'analyzed', id, 'image');

    return this.httpClient.get(url, { responseType: 'blob' as 'blob', ...skipGlobalError() });
  }

  /** Alle offenen Analysen; der Endpoint kennt keine Seitenparameter (AC36) */
  getAnalyzedBills(): Observable<BillAnalyzedDto[]> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'analyzed');

    return this.httpClient.get<BillAnalyzedDtoRaw[]>(url)
      .pipe(map(raw => raw.map(mapBillAnalyzedDtoRaw)));
  }

  analyzeBill(file: File): Observable<AnalyzeBillResultDto> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'analyze');

    const formData = new FormData();
    formData.set('file', file);

    // bei Fehlern öffnet der Scan das Formular mit eigenem Hinweis
    return this.httpClient.post<AnalyzeBillResultDto>(url, formData, skipGlobalError());
  }

  deleteAnalyzedBill(id: string): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'analyzed', id);

    return this.httpClient.delete<void>(url, skipGlobalError());
  }

  getShopStats(): Observable<ShopStatDto[]> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'shop-stats');

    return this.httpClient.get<ShopStatDtoRaw[]>(url)
      .pipe(map(raw => raw.map(mapShopStatDtoRaw)));
  }

  /** Löscht alle Rechnungsdaten des Benutzers (AC31). Der Aufrufer zeigt bei Fehlern eine eigene Meldung. */
  deleteUserData(): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'user-data');

    return this.httpClient.delete<void>(url, skipGlobalError());
  }
}
