import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { getRecordOfProperties } from 'src/app/shared/utils/utils';
import { environment } from 'src/environments/environment';
import { PagedResultDto } from '../common-dtos/PagedResultDto';
import { createHttpParameters } from '../functions/api-utils';
import { constructPath, constructVersionedPath } from '../functions/functions';
import { BillCreateDto } from './dtos/BillCreateDto';
import { BillDto, BillDtoRaw, mapBillDtoRaw, mapPagedBillDtoResultRaw } from './dtos/BillDto';
import { BillUpdateDto } from './dtos/BillUpdateDto';
import { getSearchBillsHttpParams, SearchBillsParameters } from './dtos/SearchBillsParameters';

@Injectable({
  providedIn: 'root'
})
export class BillApiService {
  private endpointUrl: string;
  private apiVersion: string = "1.0";

  constructor(private httpClient: HttpClient) {
    if (environment.dapr) {
      this.endpointUrl = constructPath(environment.gatewayBaseUrl, 'shopping-api', 'bill');
    } else {
      this.endpointUrl = 'https://localhost:8200/api/bill';
    }
  }

  searchBills(parameters: SearchBillsParameters): Observable<PagedResultDto<BillDto>> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl);

    const httpParameters = createHttpParameters(getSearchBillsHttpParams(parameters));

    return this.httpClient.get<PagedResultDto<BillDtoRaw>>(url, { params: httpParameters})
      .pipe(map(mapPagedBillDtoResultRaw));
  }

  addBill(dto: BillCreateDto): Observable<BillDto> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl);

    const formData = new FormData();
    const createDtoData = getRecordOfProperties<BillCreateDto>(dto);
    for (const key in createDtoData) {
      formData.set(key, createDtoData[key]);
    }

    return this.httpClient.post<BillDtoRaw>(url, formData)
      .pipe(map(mapBillDtoRaw));
  }

  updateBill(id: string, dto: BillUpdateDto): Observable<BillDto> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, id);

    const formData = new FormData();
    const updateDtoData = getRecordOfProperties<BillUpdateDto>(dto);
    for (const key in updateDtoData) {
      formData.set(key, updateDtoData[key]);
    }

    return this.httpClient.put<BillDtoRaw>(url, formData)
      .pipe(map(mapBillDtoRaw));
  }

  deleteBill(id: string): Observable<void> {
    let url = constructVersionedPath(this.apiVersion, this.endpointUrl, id);
    
    return this.httpClient.delete<void>(url);
  }

  uploadImage(billId: string, file: File): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, billId, 'image');

    const formData = new FormData();
    formData.set('image', file);
    
    return this.httpClient.post<void>(url, formData);
  }

  downloadImage(billId: string) {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, billId, 'image');

    return this.httpClient.get(url, { responseType: 'blob' as 'blob' });
  }

  deleteImage(billId: string): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, billId, 'image');

    return this.httpClient.delete<void>(url);
  }
}
