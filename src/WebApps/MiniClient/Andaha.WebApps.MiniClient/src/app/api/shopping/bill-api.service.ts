import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { addApiVersion, constructPath } from '../functions';
import { BillCreateDto } from './models/BillCreateDto';
import { BillDto } from './models/BillDto';

@Injectable({
  providedIn: 'root'
})
export class BillApiService {
  private endpointUrl: string;
  private apiVersion: string = "1.0";

  constructor(private httpClient: HttpClient) {
    this.endpointUrl = constructPath(environment.gatewayBaseUrl, 'shopping-api', 'bill');
  }

  addBill(dto: BillCreateDto): Observable<BillDto> {
    const url = addApiVersion(this.endpointUrl, this.apiVersion);
    return this.httpClient.post<BillDto>(url, dto);
  }
}
