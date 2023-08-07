import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { CreatePersonDto } from 'src/app/api/work/dtos/CreatePersonDto';
import { PayPersonDto } from 'src/app/api/work/dtos/PayPersonDto';
import { PersonDto } from 'src/app/api/work/dtos/PersonDto';
import { UpdatePersonDto } from 'src/app/api/work/dtos/PersonUpdateDto';
import { PersonApiService } from 'src/app/api/work/person-api.service';
import { ContextService } from 'src/app/core/context.service';
import { addTimes } from '../functions/date-time-functions';
import { getHoursFromTimeString, getMinutesFromTimeString } from 'src/app/api/functions/api-utils';
import { Time } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class PersonContextService {
  private loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private persons$: BehaviorSubject<PersonDto[] | undefined> = new BehaviorSubject<PersonDto[] | undefined>(undefined);
  
  constructor(
    private contextService: ContextService,
    private personApiService: PersonApiService
  ) {
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
    const returnSubject = new Subject<void>();

    this.personApiService.payPerson(personId, dto).subscribe(
      {
        next: _ => {
          const person = this.getById(personId);
          
          const payedHoursTime: Time = {
            hours: getHoursFromTimeString(dto.payedHours),
            minutes: getMinutesFromTimeString(dto.payedHours)
          }

          if (person) {
            person.payedHours = addTimes(person.payedHours, payedHoursTime);
          }

          returnSubject.next();
        },
        error: error => returnSubject.error(error)
      }
    );

    return returnSubject.asObservable();
  }

  private fetchPersons() {
    this.loading$.next(true);

    this.personApiService
      .listPersons()
      .subscribe(
        {
          next: result => {
            this.loading$.next(false);
            this.persons$.next(result);
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
            this.fetchPersons();
          }
        } 
      }
    );
  }
}
