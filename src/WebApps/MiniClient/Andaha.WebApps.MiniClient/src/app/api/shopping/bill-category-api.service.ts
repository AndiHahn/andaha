import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from 'src/app/core/app-config.service';
import { addApiVersion, constructPath } from '../functions';
import { BillCategoryDto } from './models/BillCategoryDto';

@Injectable({
  providedIn: 'root'
})
export class BillCategoryApiService {
  private endpointUrl: string;
  private apiVersion: string = "1.0";

  constructor(private httpClient: HttpClient, appConfigService: AppConfigService) {
    const appConfig = appConfigService.getAppConfigFromCache();
    this.endpointUrl = constructPath(appConfig.gatewayBaseUrl, 'shopping-api', 'billcategory');
  }

  getAll(): Observable<BillCategoryDto[]> {
    const url = addApiVersion(this.endpointUrl, this.apiVersion);
    return this.httpClient.get<BillCategoryDto[]>(url);
  }
}
