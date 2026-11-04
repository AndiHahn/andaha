import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { constructPath } from '../functions/functions';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkApiService {
  private httpClient = inject(HttpClient);

  private endpointUrl: string;

  constructor() {
    if (environment.useMonolithApi) {
      this.endpointUrl = constructPath(environment.monolithApiBaseUrl, 'api');
    } else if (environment.useGateway) {
      this.endpointUrl = constructPath(environment.gatewayBaseUrl, 'work-api');
    } else {
      this.endpointUrl = 'https://localhost:8200/api';
    }
  }

  wakeUp(): Observable<void> {
    const url = constructPath(this.endpointUrl, 'ping');
    return this.httpClient.get<void>(url);
  }
}
