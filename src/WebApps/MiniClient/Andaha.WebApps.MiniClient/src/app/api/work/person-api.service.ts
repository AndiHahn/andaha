import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { constructPath, constructVersionedPath } from '../functions/functions';
import { PersonDto, PersonDtoRaw, mapPersonDtoRaw, mapPersonDtoRawList } from './dtos/PersonDto';
import { Observable, map } from 'rxjs';
import { CreatePersonDto } from './dtos/CreatePersonDto';
import { UpdatePersonDto } from './dtos/PersonUpdateDto';
import { PayPersonDto } from './dtos/PayPersonDto';
import { skipGlobalError } from 'src/app/core/http/skip-global-error';

@Injectable({
  providedIn: 'root'
})
export class PersonApiService {
  private httpClient = inject(HttpClient);

  private endpointUrl: string;
  private apiVersion: string = "1.0";

  constructor() {
    if (environment.useMonolithApi) {
      this.endpointUrl = constructPath(environment.monolithApiBaseUrl, 'api', 'person');
    } else if (environment.useGateway) {
      this.endpointUrl = constructPath(environment.gatewayBaseUrl, 'work-api', 'person');
    } else {
      this.endpointUrl = 'https://localhost:8200/api/person';
    }
  }

  listPersons(): Observable<PersonDto[]> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl);

    return this.httpClient.get<PersonDtoRaw[]>(url).pipe(map(mapPersonDtoRawList));
  }

  // Ändernde Aufrufe: Seiten und Dialoge zeigen bei Fehlern eine eigene Snackbar (SKIP_GLOBAL_ERROR)

  createPerson(dto: CreatePersonDto): Observable<PersonDto> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl);

    return this.httpClient.post<PersonDtoRaw>(url, dto, skipGlobalError()).pipe(map(mapPersonDtoRaw));
  }

  updatePerson(id: string, dto: UpdatePersonDto): Observable<PersonDto> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, id);

    return this.httpClient.put<PersonDtoRaw>(url, dto, skipGlobalError()).pipe(map(mapPersonDtoRaw));
  }

  payPerson(personId: string, dto: PayPersonDto): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, personId, 'pay');

    return this.httpClient.post<void>(url, dto, skipGlobalError());
  }

  /** Zahlung bearbeiten; gleiche Felder und Einheiten wie `payPerson`. Der Aufrufer zeigt bei Fehlern eine eigene Meldung. */
  updatePayment(personId: string, paymentId: string, dto: PayPersonDto): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, personId, 'payments', paymentId);

    return this.httpClient.put<void>(url, dto, skipGlobalError());
  }

  /** Zahlung löschen. Der Aufrufer zeigt bei Fehlern eine eigene Meldung. */
  deletePayment(personId: string, paymentId: string): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, personId, 'payments', paymentId);

    return this.httpClient.delete<void>(url, skipGlobalError());
  }

  deletePerson(id: string): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, id);
    
    return this.httpClient.delete<void>(url, skipGlobalError());
  }

  /** Löscht alle Stunden-Daten des Benutzers (AC31). Der Aufrufer zeigt bei Fehlern eine eigene Meldung. */
  deleteUserData(): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'user-data');

    return this.httpClient.delete<void>(url, skipGlobalError());
  }

  export(): Observable<HttpResponse<Blob>> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'export');

    return this.httpClient.get(url, { responseType: 'blob' as 'blob', observe: 'response'});
  }
}
