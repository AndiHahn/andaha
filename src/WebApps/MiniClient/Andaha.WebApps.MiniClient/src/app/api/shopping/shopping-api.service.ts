import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { constructPath } from '../functions/functions';

@Injectable({
  providedIn: 'root'
})
export class ShoppingApiService {
  private endpointUrl: string;

  constructor(private httpClient: HttpClient) {
    if (environment.dapr) {
      this.endpointUrl = constructPath(environment.gatewayBaseUrl, 'shopping-api');
    } else if (environment.useMonolithApi) {
      this.endpointUrl = constructPath(environment.monolithApiBaseUrl, 'api');
    } else {
      this.endpointUrl = 'https://localhost:8200/api';
    }
  }

  wakeUp(): Observable<void> {
    const url = constructPath(this.endpointUrl, 'ping');
    return this.httpClient.get<void>(url);
  }
}
