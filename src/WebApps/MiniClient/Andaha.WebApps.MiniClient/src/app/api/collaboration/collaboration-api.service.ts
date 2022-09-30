import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { createHttpParameters } from '../functions/api-utils';
import { constructPath } from '../functions/functions';
import { ConnectionDto } from './dtos/ConnectionDto';
import { ConnectionRequestDto } from './dtos/ConnectionRequestDto';
import { RequestAccountConnectionRequest } from './dtos/RequestAccountConnectionRequest';

@Injectable({
  providedIn: 'root'
})
export class CollaborationApiService {
  private endpointUrl: string;

  constructor(private httpClient: HttpClient) {
    if (environment.dapr) {
      this.endpointUrl = constructPath(environment.gatewayBaseUrl, 'collaboration-api', 'connection');
    } else {
      this.endpointUrl = 'https://localhost:8300/api/connection';
    }
  }

  requestConnection(requestData: RequestAccountConnectionRequest): Observable<void> {
    const url = constructPath(this.endpointUrl, 'request');

    const httpParameters = createHttpParameters([
      {
        key: 'targetUserEmailAddress',
        value: requestData.targetUserEmailAddress
      }
    ]);

    return this.httpClient.post<void>(url, null, { params: httpParameters });
  }

  acceptRequest(fromUserId: string): Observable<void> {
    const url = constructPath(this.endpointUrl, 'accept', fromUserId);
    return this.httpClient.put<void>(url, null);
  }

  declineRequest(fromUserId: string): Observable<void> {
    const url = constructPath(this.endpointUrl, 'decline', fromUserId);
    return this.httpClient.delete<void>(url);
  }

  listIncomingConnectionRequests(): Observable<ConnectionRequestDto[]> {
    const url = constructPath(this.endpointUrl, 'incoming');
    return this.httpClient.get<ConnectionRequestDto[]>(url);
  }

  listOutgoingConnectionRequests(): Observable<ConnectionRequestDto[]> {
    const url = constructPath(this.endpointUrl, 'outgoing');
    return this.httpClient.get<ConnectionRequestDto[]>(url);
  }

  listConnections(): Observable<ConnectionDto[]> {
    const url = constructPath(this.endpointUrl, 'established');

    return this.httpClient.get<ConnectionDto[]>(url);
  }
}
