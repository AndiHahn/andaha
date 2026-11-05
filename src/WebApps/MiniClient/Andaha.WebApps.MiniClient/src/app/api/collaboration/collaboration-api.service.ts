import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { createHttpParameters } from '../functions/api-utils';
import { constructPath, constructVersionedPath } from '../functions/functions';
import { ConnectionDto } from './dtos/ConnectionDto';
import { ConnectionRequestDto } from './dtos/ConnectionRequestDto';
import { RequestAccountConnectionRequest } from './dtos/RequestAccountConnectionRequest';
import { skipGlobalError } from 'src/app/core/http/skip-global-error';

@Injectable({
  providedIn: 'root'
})
export class CollaborationApiService {
  private httpClient = inject(HttpClient);

  private endpointUrl: string;
  private apiVersion: string = "1.0";

  constructor() {
    if (environment.useMonolithApi) {
      this.endpointUrl = constructPath(environment.monolithApiBaseUrl, 'api');
    } else if (environment.useGateway) {
      this.endpointUrl = constructPath(environment.gatewayBaseUrl, 'collaboration-api');
    } else {
      this.endpointUrl = 'https://localhost:8300/api';
    }
  }

  wakeUp(): Observable<void> {
    const url = constructPath(this.endpointUrl, 'ping');
    return this.httpClient.get<void>(url);
  }

  requestConnection(requestData: RequestAccountConnectionRequest): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'connection', 'request');

    const httpParameters = createHttpParameters([
      {
        key: 'targetUserEmailAddress',
        value: requestData.targetUserEmailAddress
      }
    ]);

    return this.httpClient.post<void>(url, null, { params: httpParameters });
  }

  acceptRequest(fromUserId: string): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'connection', 'accept', fromUserId);
    return this.httpClient.put<void>(url, null);
  }

  declineRequest(fromUserId: string): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'connection', 'decline', fromUserId);
    return this.httpClient.delete<void>(url);
  }

  listIncomingConnectionRequests(): Observable<ConnectionRequestDto[]> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'connection', 'incoming');
    return this.httpClient.get<ConnectionRequestDto[]>(url);
  }

  listOutgoingConnectionRequests(): Observable<ConnectionRequestDto[]> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'connection', 'outgoing');
    return this.httpClient.get<ConnectionRequestDto[]>(url);
  }

  listConnections(): Observable<ConnectionDto[]> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'connection', 'established');

    return this.httpClient.get<ConnectionDto[]>(url);
  }

  /** Verbindung zu `userId` trennen (beide Richtungen). Der Aufrufer zeigt bei Fehlern eine eigene Meldung. */
  removeConnection(userId: string): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'connection', userId);
    return this.httpClient.delete<void>(url, skipGlobalError());
  }

  /** Eigene offene Anfrage an `targetUserId` zurückziehen. Der Aufrufer zeigt bei Fehlern eine eigene Meldung. */
  withdrawRequest(targetUserId: string): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'connection', 'request', targetUserId);
    return this.httpClient.delete<void>(url, skipGlobalError());
  }

  /** Löscht alle Verbindungen und Anfragen des Benutzers (AC31). Der Aufrufer zeigt bei Fehlern eine eigene Meldung. */
  deleteUserData(): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'connection', 'user-data');
    return this.httpClient.delete<void>(url, skipGlobalError());
  }
}
