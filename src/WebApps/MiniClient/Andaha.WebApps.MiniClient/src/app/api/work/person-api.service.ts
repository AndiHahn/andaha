import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { constructPath, constructVersionedPath } from '../functions/functions';
import { PersonDto, PersonDtoRaw, mapPersonDtoRaw, mapPersonDtoRawList } from './dtos/PersonDto';
import { Observable, map } from 'rxjs';
import { CreatePersonDto } from './dtos/CreatePersonDto';
import { UpdatePersonDto } from './dtos/PersonUpdateDto';

@Injectable({
  providedIn: 'root'
})
export class PersonApiService {
  private endpointUrl: string;
  private apiVersion: string = "1.0";

  constructor(private httpClient: HttpClient) {
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

  createPerson(dto: CreatePersonDto): Observable<PersonDto> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl);

    return this.httpClient.post<PersonDtoRaw>(url, dto).pipe(map(mapPersonDtoRaw));
  }

  updatePerson(id: string, dto: UpdatePersonDto): Observable<PersonDto> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, id);

    return this.httpClient.put<PersonDtoRaw>(url, dto).pipe(map(mapPersonDtoRaw));
  }

  payPerson(personId: string, payedHours: number): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, personId, 'pay');

    return this.httpClient.post<void>(url, payedHours);
  }
}
