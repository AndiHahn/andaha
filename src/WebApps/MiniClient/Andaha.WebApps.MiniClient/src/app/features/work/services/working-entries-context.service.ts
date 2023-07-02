import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { WorkingEntryDto } from 'src/app/api/work/dtos/WorkingEntryDto';
import { WorkingEntryApiService } from 'src/app/api/work/working-entry-api.service';
import { getParametersFromRouteRecursive } from 'src/app/shared/utils/routing-helper';

@Injectable({
  providedIn: 'root'
})
export class WorkingEntriesContextService {
  private loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private workingEntries$: BehaviorSubject<WorkingEntryDto[] | undefined> = new BehaviorSubject<WorkingEntryDto[] | undefined>(undefined);
  
  private personId: string;

  constructor(
    private route: ActivatedRoute,
    private apiService: WorkingEntryApiService
  ) {
    const params = getParametersFromRouteRecursive(this.route.snapshot);
    this.personId = params["id"];
    if (!this.personId) {
      throw new Error("No personId available.");
    }
    
    this.fetchWorkingEntries();
  }

  workingEntries(): Observable<WorkingEntryDto[] | undefined> {
    return this.workingEntries$.asObservable();
  }

  loading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  /*
  createPerson(dto: CreatePersonDto): Observable<void> {
    const returnSubject = new Subject<void>();

    this.personApiService.createPerson(dto).subscribe(
      {
        next: person => {
          if (this.persons$.value) {
            const newPersons = this.persons$.value.concat(person);
            newPersons.sort(this.sortByNameAscending);
            this.persons$.next(newPersons)
          }

          returnSubject.next();
        },
        error: error => returnSubject.error(error)
      }
    );

    return returnSubject.asObservable();
  }
  */

  deleteEntry(id: string): Observable<void> {
    const returnSubject = new Subject<void>();

    if (!this.workingEntries$.value) {
      returnSubject.error('No working entries available.')

      return returnSubject.asObservable();
    }

    const entriesWithoutDeleted = this.workingEntries$.value.filter(entry => entry.id != id);
    this.workingEntries$.next(entriesWithoutDeleted);

    this.apiService.deleteWorkingEntry(id).subscribe(
      {
        next: _ => {
          returnSubject.next();
        },
        error: error => {
          this.fetchWorkingEntries();
          returnSubject.error(error);
        } 
      }
    );

    return returnSubject.asObservable();
  }

  private fetchWorkingEntries() {
    this.loading$.next(true);

    this.apiService
      .listWorkingEntries(this.personId)
      .subscribe(
        {
          next: result => {
            this.loading$.next(false);
            this.workingEntries$.next(result);
          },
          error: _ => this.loading$.next(false)
        }
    );
  }
}
