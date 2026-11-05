import { Injectable, Signal, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import { afterFirstLoad } from 'src/app/shared/utils/load-state';
import { FixedCostCreateDto } from 'src/app/api/budgetplan/dtos/FixedCostCreateDto';
import { FixedCostDto } from 'src/app/api/budgetplan/dtos/FixedCostDto';
import { FixedCostUpdateDto } from 'src/app/api/budgetplan/dtos/FixedCostUpdateDto';
import { FixedCostApiService } from 'src/app/api/budgetplan/fixedcost-api.service';
import { ContextService } from 'src/app/core/context.service';

@Injectable({
  providedIn: 'root'
})
export class FixedCostContextService {
  private contextService = inject(ContextService);
  private fixedCostApiService = inject(FixedCostApiService);

  private loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private fixedCosts$: BehaviorSubject<FixedCostDto[] | undefined> = new BehaviorSubject<FixedCostDto[] | undefined>(undefined);
  private loadState$ = new ReplaySubject<'loaded' | 'failed'>(1);
  private changed$ = new Subject<void>();
  private readonly errorState = signal(false);
  private backendIsReady: boolean = false;

  /** true, wenn das letzte Laden der Liste fehlgeschlagen ist (nachdem das Backend bereit war) */
  readonly error: Signal<boolean> = this.errorState.asReadonly();

  constructor() {
    this.fetchFixedCosts();
    this.initSubscriptions();
  }

  fixedCosts(): Observable<FixedCostDto[] | undefined> {
    return this.fixedCosts$.asObservable();
  }

  loading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  /** Meldet jede vom Server bestätigte Änderung (Anlegen, Ändern, Löschen); nie beim optimistischen Entfernen */
  changed(): Observable<void> {
    return this.changed$.asObservable();
  }

  /** Liste erneut laden (bzw. Backend erneut wecken, solange es nicht bereit ist) */
  retry(): void {
    if (this.backendIsReady) {
      this.fetchFixedCosts();
    } else {
      this.contextService.retryWakeUp();
    }
  }

  getById(id: string): FixedCostDto | undefined {
    return this.fixedCosts$.value?.find(cost => cost.id == id);
  }

  byId(id: string): Observable<FixedCostDto | undefined> {
    return afterFirstLoad(this.loadState$, () => this.getById(id));
  }

  createFixedCost(dto: FixedCostCreateDto): Observable<void> {
    const returnSubject = new Subject<void>();

    this.fixedCostApiService.create(dto).subscribe(
      {
        next: _ => {
          returnSubject.next();
          this.fetchFixedCosts();
          this.changed$.next();
        },
        error: error => returnSubject.error(error)
      }
    );

    return returnSubject.asObservable();
  }

  updateFixedCost(id: string, dto: FixedCostUpdateDto): Observable<void> {
    const returnSubject = new Subject<void>();

    this.fixedCostApiService.update(id, dto).subscribe(
      {
        next: _ => {
          returnSubject.next();
          this.fetchFixedCosts();
          this.changed$.next();
        },
        error: error => returnSubject.error(error)
      }
    );

    return returnSubject.asObservable();
  }

  deleteFixedCost(id: string): Observable<void> {
    const returnSubject = new Subject<void>();

    const costsWithoutDeleted = this.fixedCosts$.value?.filter(cost => cost.id != id);
    
    this.fixedCosts$.next(costsWithoutDeleted);

    this.fixedCostApiService.delete(id).subscribe(
      {
        next: _ => {
          returnSubject.next();
          this.changed$.next();
        },
        error: error => {
          returnSubject.error(error);
          this.fetchFixedCosts();
        } 
      }
    );

    return returnSubject.asObservable();
  }

  private fetchFixedCosts() {
    this.loading$.next(true);
    this.errorState.set(false);

    this.fixedCostApiService
      .list()
      .subscribe(
        {
          next: result => {
            this.loading$.next(false);
            this.fixedCosts$.next(result);
            this.loadState$.next('loaded');
          },
          error: _ => {
            this.loading$.next(false);
            if (this.backendIsReady) {
              this.errorState.set(true);
              this.loadState$.next('failed');
            }
          }
        }
    );
  }

  private initSubscriptions(): void {
    this.contextService.backendReady().subscribe(
      {
        next: ready => {
          this.backendIsReady = ready;
          if (ready) {
            this.fetchFixedCosts();
          }
        } 
      }
    );
  }
}
