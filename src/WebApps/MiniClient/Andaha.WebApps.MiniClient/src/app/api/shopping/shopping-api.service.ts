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
    this.endpointUrl = constructPath(environment.gatewayBaseUrl, 'shopping-api');
  }

  wakeUp(): Observable<void> {
    const url = constructPath(this.endpointUrl, 'ping');
    return this.httpClient.get<void>(url);
  }
}
