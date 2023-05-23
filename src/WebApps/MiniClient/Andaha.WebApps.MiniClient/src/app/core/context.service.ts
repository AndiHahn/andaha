import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BudgetPlanApiService } from '../api/budgetplan/budgetplan-api.service';
import { CollaborationApiService } from '../api/collaboration/collaboration-api.service';
import { ShoppingApiService } from '../api/shopping/shopping-api.service';
import { AuthService } from './auth.service';
import { WorkApiService } from '../api/work/work-api.service';

@Injectable({
  providedIn: 'root'
})
export class ContextService {
  private backendReady$ = new BehaviorSubject<boolean>(false);

  private userIsLoggedInInternal: boolean = false;
  private shoppingApiAwakeInternal: boolean = false;
  private collaborationApiAwakeInternal: boolean = false;
  private budgetplanApiAwakeInternal: boolean = false;
  private workApiAwakeInternal: boolean = false;

  constructor(
    authService: AuthService,
    private shoppingApiService: ShoppingApiService,
    private collaborationApiService: CollaborationApiService,
    private budgetPlanApiService: BudgetPlanApiService,
    private workApiService: WorkApiService) {

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
          this.budgetplanApiAwakeInternal = true;
          this.refreshBackendReady();
        }
      }
    );

    this.workApiService.wakeUp().subscribe(
      {
        next: _ => {
          this.workApiAwakeInternal = true;
          this.refreshBackendReady();
        }
      }
    )
  }

  private refreshBackendReady() {
    if (this.userIsLoggedInInternal &&
        this.shoppingApiAwakeInternal &&
        this.collaborationApiAwakeInternal &&
        this.budgetplanApiAwakeInternal &&
        this.workApiAwakeInternal) {
      this.backendReady$.next(true);
    }
  }
}
