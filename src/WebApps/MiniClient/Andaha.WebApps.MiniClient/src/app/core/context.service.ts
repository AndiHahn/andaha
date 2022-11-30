import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BudgetPlanApiService } from '../api/budgetplan/budgetplan-api.service';
import { CollaborationApiService } from '../api/collaboration/collaboration-api.service';
import { ShoppingApiService } from '../api/shopping/shopping-api.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ContextService {
  private backendReady$ = new BehaviorSubject<boolean>(false);

  private userIsLoggedInInternal: boolean = false;
  private shoppingApiAwakeInternal: boolean = false;
  private collaborationApiAwakeInternal: boolean = false;
  private budgetpplanApiAwakeInternal: boolean = false;

  constructor(
    authService: AuthService,
    private shoppingApiService: ShoppingApiService,
    private collaborationApiService: CollaborationApiService,
    private budgetPlanApiService: BudgetPlanApiService) {

      this.wakeUpBackendServices();

      authService.loggedIn().subscribe(
        {
          next: _ => {
            this.userIsLoggedInInternal = true;
            this.refreshBackendReady();
          } 
        }
      );
  }

  backendReady(): Observable<boolean> {
    return this.backendReady$.asObservable();
  }

  private wakeUpBackendServices(): void {
    this.shoppingApiService.wakeUp().subscribe(
      {
        next: _ => {
          this.shoppingApiAwakeInternal = true;
          this.refreshBackendReady();
        }
      }
    );

    this.collaborationApiService.wakeUp().subscribe(
      {
        next: _ => {
          this.collaborationApiAwakeInternal = true;
          this.refreshBackendReady();
        }
      }
    );

    this.budgetPlanApiService.wakeUp().subscribe(
      {
        next: _ => {
          this.budgetpplanApiAwakeInternal = true;
          this.refreshBackendReady();
        }
      }
    );
  }

  private refreshBackendReady() {
    if (this.userIsLoggedInInternal &&
        this.shoppingApiAwakeInternal &&
        this.collaborationApiAwakeInternal &&
        this.budgetpplanApiAwakeInternal) {
      this.backendReady$.next(true);
    }
  }
}
