import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PagedResultDto } from '../common-dtos/PagedResultDto';
import { createHttpParameters } from '../functions/api-utils';
import { addApiVersion, constructPath } from '../functions/functions';
import { BillCreateDto } from './dtos/BillCreateDto';
import { BillDto, BillDtoRaw, mapBillDtoRaw, mapPagedBillDtoResultRaw } from './dtos/BillDto';
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
    const url = addApiVersion(this.endpointUrl, this.apiVersion);

    const httpParameters = createHttpParameters(getSearchBillsHttpParams(parameters));

    return this.httpClient.get<PagedResultDto<BillDtoRaw>>(url, { params: httpParameters})
      .pipe(map(mapPagedBillDtoResultRaw));
  }

  addBill(dto: BillCreateDto): Observable<BillDto> {
    const url = addApiVersion(this.endpointUrl, this.apiVersion);
    return this.httpClient.post<BillDtoRaw>(url, dto)
      .pipe(map(mapBillDtoRaw));
  }

  deleteBill(id: string): Observable<void> {
    let url = constructPath(this.endpointUrl, id);
    url = addApiVersion(url, this.apiVersion);
    
    return this.httpClient.delete<void>(url);
  }
}
