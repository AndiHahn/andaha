import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AppConfigService } from 'src/app/core/app-config.service';
import { constructPath } from '../functions';

@Injectable({
  providedIn: 'root'
})
export class ShoppingApiService {
  private endpointUrl: string;

  constructor(private httpClient: HttpClient, appConfigService: AppConfigService) {
    const appConfig = appConfigService.getAppConfigFromCache();
    this.endpointUrl = constructPath(appConfig.apiBaseUrl, 'shopping-api');
  }

  wakeUp(): Observable<void> {
    const url = constructPath(this.endpointUrl, 'ping');
    return this.httpClient.get<void>(url);
  }
}
