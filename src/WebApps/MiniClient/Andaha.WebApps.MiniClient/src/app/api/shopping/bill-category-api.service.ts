import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { constructPath, constructVersionedPath } from '../functions/functions';
import { CategoryDto } from './dtos/CategoryDto';
import { CategoryUpdateDto } from './dtos/CategoryUpdateDto';
import { CategoryCreateDto } from './dtos/CategoryCreateDto';
import { CategoryOrderDto } from './dtos/CategoryOrderDto';
import { skipGlobalError } from 'src/app/core/http/skip-global-error';

@Injectable({
  providedIn: 'root'
})
export class BillCategoryApiService {
  private httpClient = inject(HttpClient);

  private endpointUrl: string;
  private apiVersion: string = "1.0";

  constructor() {
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

  // Ändernde Aufrufe: Kategorie-Seiten zeigen bei Fehlern eine eigene Snackbar (SKIP_GLOBAL_ERROR)

  create(category: CategoryCreateDto): Observable<CategoryDto> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl);
    
    return this.httpClient.post<CategoryDto>(url, category, skipGlobalError());
  }

  update(id: string, category: CategoryUpdateDto): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, id);
    return this.httpClient.put<void>(url, category, skipGlobalError());
  }

  updateOrders(categoryOrders: CategoryOrderDto[]): Observable<void> {
    const url = constructVersionedPath(this.apiVersion, this.endpointUrl, 'orders');
    return this.httpClient.put<void>(url, categoryOrders, skipGlobalError());
  }

  delete(id: string): Observable<void> {
    let url = constructVersionedPath(this.apiVersion, this.endpointUrl, id);
    
    return this.httpClient.delete<void>(url, skipGlobalError());
  }
}
