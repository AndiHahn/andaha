import { HttpClient, HttpEvent } from '@angular/common/http';
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
import { AutoCreatedBillDto, AutoCreatedBillDtoRaw, mapAutoCreatedBillDtoRaw } from './dtos/AutoCreatedBillDto';
import { mapPendingAnalysisDtoRaw, PendingAnalysisDto, PendingAnalysisDtoRaw } from './dtos/PendingAnalysisDto';
import { currentTimeZone } from 'src/app/shared/utils/time-zone';
import { mapShopStatDtoRaw, ShopStatDto, ShopStatDtoRaw } from './dtos/ShopStatDto';
import { getSearchBillsHttpParams, SearchBillsParameters } from './dtos/SearchBillsParameters';

/**
 * Formularfelder für Anlegen/Bearbeiten. Positionen gehen als JSON-Text in `lineItems`:
 * ohne Feld bleiben sie beim Bearbeiten unverändert, [] entfernt sie.
 */
function toBillFormData(dto: BillCreateDto | BillUpdateDto): FormData {
  const { lineItems, ...fields } = dto;

  const formData = new FormData();
  const fieldData = getRecordOfProperties(fields);
  for (const key in fieldData) {
    if (fieldData[key] == null) {
      continue; // sonst landet der Text "undefined" im Formular
    }
    formData.set(key, fieldData[key]);
  }

  if (lineItems) {
    formData.set('lineItems', JSON.stringify(lineItems));
  }

  return formData;
}

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

    // Aufrufer melden Fehler selbst (Offline-Speicher bzw. Übernehmen aus der Analyse, Review Focus 5)
    return this.httpClient.post<BillDtoRaw>(url, toBillFormData(dto), skipGlobalError())
      .pipe(map(mapBillDtoRaw));
  }

  updateBill(id: string, dto: BillUpdateDto): Observable<BillDto> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, id);

    return this.httpClient.put<BillDtoRaw>(url, toBillFormData(dto), skipGlobalError())
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

  /**
   * Lädt ein Foto zur Analyse hoch; liefert Fortschritts-Events und zuletzt die Antwort (202, Bild-ID).
   * Fehler zeigt der Upload-Eintrag selbst („Upload fehlgeschlagen“), keine globale Snackbar.
   */
  uploadForAnalysis(file: Blob, fileName: string): Observable<HttpEvent<{ id: string }>> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'upload-for-analysis');

    const formData = new FormData();
    formData.set('file', file, fileName);

    // reportUploadProgress statt des in Angular 22 veralteten reportProgress; braucht withXhr() (app.config)
    return this.httpClient.post<{ id: string }>(url, formData, {
      reportUploadProgress: true,
      observe: 'events',
      ...skipGlobalError()
    });
  }

  /** Eigene Bilder, deren Analyse noch läuft. Wird abgefragt: Fehler ohne globale Snackbar. */
  getPendingAnalyses(): Observable<PendingAnalysisDto[]> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'analyzed', 'pending');

    return this.httpClient.get<PendingAnalysisDtoRaw[]>(url, skipGlobalError())
      .pipe(map(raw => raw.map(mapPendingAnalysisDtoRaw)));
  }

  /** Heute (lokaler Tag über `tz`) automatisch angelegte Rechnungen. Wird abgefragt: Fehler ohne globale Snackbar. */
  getTodayAutoCreated(): Observable<AutoCreatedBillDto[]> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'analyzed', 'today');

    return this.httpClient.get<AutoCreatedBillDtoRaw[]>(url, { params: { tz: currentTimeZone() }, ...skipGlobalError() })
      .pipe(map(raw => raw.map(mapAutoCreatedBillDtoRaw)));
  }

  downloadAnalyzedBillImage(id: string) {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'analyzed', id, 'image');

    return this.httpClient.get(url, { responseType: 'blob' as 'blob', ...skipGlobalError() });
  }

  /** Alle offenen Analysen; der Endpoint kennt keine Seitenparameter (AC36) */
  getAnalyzedBills(options?: { silent?: boolean }): Observable<BillAnalyzedDto[]> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'analyzed');

    // silent: Abfragen im Takt (US-0009), Fehler ohne globale Snackbar
    return this.httpClient.get<BillAnalyzedDtoRaw[]>(url, options?.silent ? skipGlobalError() : undefined)
      .pipe(map(raw => raw.map(mapBillAnalyzedDtoRaw)));
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
