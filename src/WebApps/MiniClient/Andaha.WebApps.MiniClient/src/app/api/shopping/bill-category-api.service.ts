import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { constructPath, constructVersionedPath } from '../functions/functions';
import { CategoryDto } from './dtos/CategoryDto';
import { CategoryUpdateDto } from './dtos/CategoryUpdateDto';

@Injectable({
  providedIn: 'root'
})
export class BillCategoryApiService {
  private endpointUrl: string;
  private apiVersion: string = "1.0";

  constructor(private httpClient: HttpClient) {
    if (environment.useMonolithApi) {
      this.endpointUrl = constructPath(environment.monolithApiBaseUrl, 'api', 'billcategory');
    } else if (environment.useGateway) {
      this.endpointUrl = constructPath(environment.gatewayBaseUrl, 'shopping-api', 'billcategory');
    } else {
      this.endpointUrl = 'https://localhost:8200/api/billcategory';
    }
  }

  getAll(): Observable<CategoryDto[]> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl);
    return this.httpClient.get<CategoryDto[]>(url);
  }

  bulkUpdate(categories: CategoryUpdateDto[]): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl);
    return this.httpClient.put<void>(url, categories);
  }
}
