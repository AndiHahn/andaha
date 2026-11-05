import { DestroyRef, Injectable, Signal, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable, finalize } from 'rxjs';
import { BudgetPlanApiService } from '../api/budgetplan/budgetplan-api.service';
import { CollaborationApiService } from '../api/collaboration/collaboration-api.service';
import { ShoppingApiService } from '../api/shopping/shopping-api.service';
import { AuthService } from './auth.service';
import { WorkApiService } from '../api/work/work-api.service';

type BackendApi = 'shopping' | 'collaboration' | 'budgetplan' | 'work';

@Injectable({
  providedIn: 'root'
})
export class ContextService {
  private shoppingApiService = inject(ShoppingApiService);
  private collaborationApiService = inject(CollaborationApiService);
  private budgetPlanApiService = inject(BudgetPlanApiService);
  private workApiService = inject(WorkApiService);

  private backendReady$ = new BehaviorSubject<boolean>(false);
  private readonly backendUnreachableState = signal(false);

  private userIsLoggedInInternal: boolean = false;
  private readonly awake: Record<BackendApi, boolean> = { shopping: false, collaboration: false, budgetplan: false, work: false };
  private readonly pending = new Set<BackendApi>();

  /**
   * true, wenn ein Dienst beim Wecken nicht erreichbar war (offline gestartet, Backend nicht erreichbar).
   * Die Listen zeigen dann ihren Fehlerzustand mit „Erneut versuchen“; ein neuer Weckversuch setzt es zurück.
   */
  readonly backendUnreachable: Signal<boolean> = this.backendUnreachableState.asReadonly();

  private readonly onOnline = () => {
    if (!this.backendReady$.value) {
      this.retryWakeUp();
    }
  };

  constructor() {
      const authService = inject(AuthService);

      this.wakeUpBackendServices();

      window.addEventListener('online', this.onOnline);
      inject(DestroyRef).onDestroy(() => window.removeEventListener('online', this.onOnline));

      authService.loggedIn().subscribe(
        {
          next: _ => {
            this.userIsLoggedInInternal = true;
            this.refreshBackendReady();
          } 
        }
      );
  }

  /** Weckt die Dienste erneut, die noch nicht geantwortet haben (z. B. nach einem Netzfehler). */
  retryWakeUp(): void {
    this.wakeUpBackendServices();
  }

  backendReady(): Observable<boolean> {
    return this.backendReady$.asObservable();
  }

  private wakeUpBackendServices(): void {
    this.backendUnreachableState.set(false);
    this.wakeUp('shopping', () => this.shoppingApiService.wakeUp());
    this.wakeUp('collaboration', () => this.collaborationApiService.wakeUp());
    this.wakeUp('budgetplan', () => this.budgetPlanApiService.wakeUp());
    this.wakeUp('work', () => this.workApiService.wakeUp());
  }

  /** Ein Dienst wird nur geweckt, solange er nicht wach ist und kein Weckruf mehr unterwegs ist */
  private wakeUp(api: BackendApi, request: () => Observable<void>): void {
    if (this.awake[api] || this.pending.has(api)) {
      return;
    }

    this.pending.add(api);
    request().pipe(finalize(() => this.pending.delete(api))).subscribe(
      {
        next: _ => {
          this.awake[api] = true;
          this.refreshBackendReady();
        },
        error: _ => this.backendUnreachableState.set(true)
      }
    );
  }

  private refreshBackendReady() {
    if (this.userIsLoggedInInternal && Object.values(this.awake).every(awake => awake)) {
      this.backendUnreachableState.set(false);
      this.backendReady$.next(true);
    }
  }
}
