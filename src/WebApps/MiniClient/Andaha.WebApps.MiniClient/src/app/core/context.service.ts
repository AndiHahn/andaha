import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ShoppingApiService } from '../api/shopping/shopping-api.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ContextService {
  private shoppingApiReadySubject = new BehaviorSubject<boolean>(false);

  private userIsLoggedInInternal: boolean = false;
  private shoppingApiAwakeInternal: boolean = false;

  constructor(
    authService: AuthService,
    private shoppingApiService: ShoppingApiService) {

      this.wakeUpBackendServices();

      authService.loggedIn().subscribe(
        {
          next: _ => {
            this.userIsLoggedInInternal = true;
            this.refreshShoppingApiReady();
          } 
        }
      );
  }

  shoppingApiReady(): Observable<boolean> {
    return this.shoppingApiReadySubject.asObservable();
  }

  private wakeUpBackendServices(): void {
    this.shoppingApiService.wakeUp().subscribe({
      next: _ => {
        this.shoppingApiAwakeInternal = true;
        this.refreshShoppingApiReady();
      }
    });
  }

  private refreshShoppingApiReady() {
    if (this.userIsLoggedInInternal && this.shoppingApiAwakeInternal) {
      this.shoppingApiReadySubject.next(true);
    }
  }
}
