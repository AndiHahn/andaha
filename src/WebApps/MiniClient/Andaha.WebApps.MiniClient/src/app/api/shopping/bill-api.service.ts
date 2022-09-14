import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PagedResultDto } from '../common-dtos/PagedResultDto';
import { createHttpParameters } from '../functions/api-utils';
import { addApiVersion, constructPath } from '../functions/functions';
import { BillCreateDto } from './models/BillCreateDto';
import { BillDto } from './models/BillDto';
import { getSearchBillsHttpParams, SearchBillsParameters } from './models/SearchBillsParameters';

@Injectable({
  providedIn: 'root'
})
export class BillApiService {
  private endpointUrl: string;
  private apiVersion: string = "1.0";

  constructor(private httpClient: HttpClient) {
    this.endpointUrl = constructPath(environment.gatewayBaseUrl, 'shopping-api', 'bill');
  }

  searchBills(parameters: SearchBillsParameters): Observable<PagedResultDto<BillDto>> {
    const url = addApiVersion(this.endpointUrl, this.apiVersion);

    const httpParameters = createHttpParameters(getSearchBillsHttpParams(parameters));

    return this.httpClient.get<PagedResultDto<BillDto>>(url, { params: httpParameters});
  }

  addBill(dto: BillCreateDto): Observable<BillDto> {
    const url = addApiVersion(this.endpointUrl, this.apiVersion);
    return this.httpClient.post<BillDto>(url, dto);
  }
}
