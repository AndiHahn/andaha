import { Injectable, Signal, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import { afterFirstLoad } from 'src/app/shared/utils/load-state';
import { CreatePersonDto } from 'src/app/api/work/dtos/CreatePersonDto';
import { PayPersonDto } from 'src/app/api/work/dtos/PayPersonDto';
import { PersonDto } from 'src/app/api/work/dtos/PersonDto';
import { UpdatePersonDto } from 'src/app/api/work/dtos/PersonUpdateDto';
import { PersonApiService } from 'src/app/api/work/person-api.service';
import { ContextService } from 'src/app/core/context.service';
import { downloadFile, getFileName } from 'src/app/shared/utils/file-utils';

@Injectable({
  providedIn: 'root'
})
export class PersonContextService {
  private contextService = inject(ContextService);
  private personApiService = inject(PersonApiService);

  private loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private persons$: BehaviorSubject<PersonDto[] | undefined> = new BehaviorSubject<PersonDto[] | undefined>(undefined);
  private loadState$ = new ReplaySubject<'loaded' | 'failed'>(1);
  private readonly errorState = signal(false);
  private backendIsReady: boolean = false;

  /** true, wenn das letzte Laden der Liste fehlgeschlagen ist (nachdem das Backend bereit war) */
  readonly error: Signal<boolean> = this.errorState.asReadonly();

  constructor() {
    this.fetchPersons();
    this.initSubscriptions();
  }

  persons(): Observable<PersonDto[] | undefined> {
    return this.persons$.asObservable();
  }

  loading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  refetch(): void {
    this.fetchPersons();
  }

  getById(id: string): PersonDto | undefined {
    return this.persons$.value?.find(person => person.id == id);
  }

  byId(id: string): Observable<PersonDto | undefined> {
    return afterFirstLoad(this.loadState$, () => this.getById(id));
  }

  createPerson(dto: CreatePersonDto): Observable<void> {
    const returnSubject = new Subject<void>();

    this.personApiService.createPerson(dto).subscribe(
      {
        next: person => {
          if (this.persons$.value) {
            const newPersons = this.persons$.value.concat(person);
            this.persons$.next(newPersons)
          }

          returnSubject.next();
        },
        error: error => returnSubject.error(error)
      }
    );

    return returnSubject.asObservable();
  }

  updatePerson(id: string, dto: UpdatePersonDto): Observable<void> {
    const returnSubject = new Subject<void>();

    this.personApiService.updatePerson(id, dto).subscribe(
      {
        next: _ => {
          returnSubject.next();
          this.fetchPersons();
        },
        error: error => returnSubject.error(error)
      }
    );

    return returnSubject.asObservable();
  }

  deletePerson(id: string): Observable<void> {
    const returnSubject = new Subject<void>();

    if (!this.persons$.value) {
      returnSubject.error('No persons available.')

      return returnSubject.asObservable();
    }

    const personsWithoutDeleted = this.persons$.value.filter(person => person.id != id);
    this.persons$.next(personsWithoutDeleted);

    this.personApiService.deletePerson(id).subscribe(
      {
        next: _ => {
          returnSubject.next();
        },
        error: error => {
          this.fetchPersons();
          returnSubject.error(error);
        } 
      }
    );

    return returnSubject.asObservable();
  }

  addPayment(personId: string, dto: PayPersonDto): Observable<void> {
    return this.refetchAfter(this.personApiService.payPerson(personId, dto));
  }

  /** Zahlung bearbeiten; danach kommen bezahlte Stunden und Zahlungen neu vom Backend */
  updatePayment(personId: string, paymentId: string, dto: PayPersonDto): Observable<void> {
    return this.refetchAfter(this.personApiService.updatePayment(personId, paymentId, dto));
  }

  /** Zahlung löschen; danach kommen bezahlte Stunden und Zahlungen neu vom Backend */
  deletePayment(personId: string, paymentId: string): Observable<void> {
    return this.refetchAfter(this.personApiService.deletePayment(personId, paymentId));
  }

  /** Liste erneut laden (bzw. Backend erneut wecken, solange es nicht bereit ist) */
  retry(): void {
    if (this.backendIsReady) {
      this.fetchPersons();
    } else {
      this.contextService.retryWakeUp();
    }
  }

  private refetchAfter(change: Observable<void>): Observable<void> {
    const returnSubject = new ReplaySubject<void>(1);

    change.subscribe(
      {
        next: _ => {
          // Zahlungen und bezahlte Stunden kommen vom Backend, keine lokale Addition
          this.fetchPersons().subscribe(
            {
              next: () => {
                returnSubject.next();
                returnSubject.complete();
              },
              error: error => {
                // Änderung ist gespeichert; ein fehlgeschlagener Refetch darf keinen zweiten Versuch ausloesen
                console.error('Refetching persons after payment change failed', error);
                returnSubject.next();
                returnSubject.complete();
              }
            }
          );
        },
        error: error => returnSubject.error(error)
      }
    );

    return returnSubject.asObservable();
  }

  downloadPersonInformations(): Observable<void> {
    const returnSubject = new ReplaySubject<void>(1);

    this.personApiService
      .export()
      .subscribe(
        {
          next: response => {
            if (!response || !response.body) {
              returnSubject.next();

              return;
            }

            downloadFile(
              response.body,
              getFileName(response.headers),
              response.body.type);

            returnSubject.next();
          },
          error: error => returnSubject.error(error)
        }
      );

    return returnSubject;
  }

  private fetchPersons(): Observable<void> {
    const result$ = new ReplaySubject<void>(1);
    this.loading$.next(true);
    this.errorState.set(false);

    this.personApiService
      .listPersons()
      .subscribe(
        {
          next: result => {
            this.loading$.next(false);
            this.persons$.next(result);
            this.loadState$.next('loaded');
            result$.next();
            result$.complete();
          },
          error: error => {
            this.loading$.next(false);
            if (this.backendIsReady) {
              this.errorState.set(true);
              this.loadState$.next('failed');
            }
            result$.error(error);
          }
        }
    );

    return result$.asObservable();
  }

  private initSubscriptions(): void {
    this.contextService.backendReady().subscribe(
      {
        next: ready => {
          this.backendIsReady = ready;
          if (ready) {
            this.fetchPersons();
          }
        } 
      }
    );
  }
}
