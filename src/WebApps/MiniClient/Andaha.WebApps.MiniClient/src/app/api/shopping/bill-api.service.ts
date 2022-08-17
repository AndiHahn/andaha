import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from 'src/app/core/app-config.service';
import { addApiVersion, constructPath } from '../functions';
import { BillCreateDto } from './models/BillCreateDto';
import { BillDto } from './models/BillDto';

@Injectable({
  providedIn: 'root'
})
export class BillApiService {
  private endpointUrl: string;
  private apiVersion: string = "1.0";

  constructor(private httpClient: HttpClient, appConfigService: AppConfigService) {
    const appConfig = appConfigService.getAppConfigFromCache();
    this.endpointUrl = constructPath(appConfig.gatewayBaseUrl, 'shopping-api', 'bill');
  }

  addBill(dto: BillCreateDto): Observable<BillDto> {
    const url = addApiVersion(this.endpointUrl, this.apiVersion);
    return this.httpClient.post<BillDto>(url, dto);
  }
}
