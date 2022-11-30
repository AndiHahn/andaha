import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { FixedCostCreateDto } from 'src/app/api/budgetplan/dtos/FixedCostCreateDto';
import { FixedCostDto } from 'src/app/api/budgetplan/dtos/FixedCostDto';
import { FixedCostUpdateDto } from 'src/app/api/budgetplan/dtos/FixedCostUpdateDto';
import { FixedCostApiService } from 'src/app/api/budgetplan/fixedcost-api.service';
import { ContextService } from 'src/app/core/context.service';

@Injectable({
  providedIn: 'root'
})
export class FixedCostContextService {
  private loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private fixedCosts$: BehaviorSubject<FixedCostDto[] | undefined> = new BehaviorSubject<FixedCostDto[] | undefined>(undefined);
  
  constructor(
    private contextService: ContextService,
    private fixedCostApiService: FixedCostApiService
  ) {
    this.fetchFixedCosts();
    this.initSubscriptions();
  }

  fixedCosts(): Observable<FixedCostDto[] | undefined> {
    return this.fixedCosts$.asObservable();
  }

  loading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  getById(id: string): FixedCostDto | undefined {
    return this.fixedCosts$.value?.find(cost => cost.id == id);
  }

  createFixedCost(dto: FixedCostCreateDto): Observable<void> {
    const returnSubject = new Subject<void>();

    this.fixedCostApiService.create(dto).subscribe(
      {
        next: _ => {
          returnSubject.next();
          this.fetchFixedCosts();
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
        next: _ => returnSubject.next(),
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

    this.fixedCostApiService
      .list()
      .subscribe(
        {
          next: result => {
            this.loading$.next(false);
            this.fixedCosts$.next(result);
          },
          error: _ => this.loading$.next(false)
        }
    );
  }

  private initSubscriptions(): void {
    this.contextService.backendReady().subscribe(
      {
        next: ready => {
          if (ready) {
            this.fetchFixedCosts();
          }
        } 
      }
    );
  }
}
