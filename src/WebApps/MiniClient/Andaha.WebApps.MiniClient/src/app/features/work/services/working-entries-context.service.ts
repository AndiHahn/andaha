import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { WorkingEntryDto } from 'src/app/api/work/dtos/WorkingEntryDto';
import { WorkingEntryApiService } from 'src/app/api/work/working-entry-api.service';
import { getParametersFromRouteRecursive } from 'src/app/shared/utils/routing-helper';
import { monthKey } from 'src/app/shared/utils/month-groups';

/** Zuerst die neuesten 3 Monate mit Einträgen, „Ältere Monate laden“ holt die nächsten 3 (Design 5.2) */
const INITIAL_MONTHS = 3;

// vorher providedIn: PersonModule; jetzt in den Providern der Route 'work/person' (work.routes.ts)
@Injectable()
export class WorkingEntriesContextService {
  private route = inject(ActivatedRoute);
  private apiService = inject(WorkingEntryApiService);

  private loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private workingEntries$: BehaviorSubject<WorkingEntryDto[] | undefined> = new BehaviorSubject<WorkingEntryDto[] | undefined>(undefined);
  
  private readonly errorState = signal(false);
  private readonly nextUntil = signal<string | null>(null);
  private readonly loadingOlderState = signal(false);
  private personId: string;

  /** true, wenn das letzte Laden der Arbeitszeiten fehlgeschlagen ist */
  readonly error: Signal<boolean> = this.errorState.asReadonly();

  /** true, wenn es ältere Monate gibt („Ältere Monate laden“) */
  readonly hasOlder: Signal<boolean> = computed(() => this.nextUntil() !== null);

  /** true, solange ältere Monate geladen werden */
  readonly loadingOlder: Signal<boolean> = this.loadingOlderState.asReadonly();

  constructor() {
    const params = getParametersFromRouteRecursive(this.route.snapshot);
    this.personId = params["id"];
    if (!this.personId) {
      throw new Error("No personId available.");
    }
    
    this.fetchWorkingEntries(INITIAL_MONTHS);
  }

  workingEntries(): Observable<WorkingEntryDto[] | undefined> {
    return this.workingEntries$.asObservable();
  }

  loading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  /** Lädt die bereits angezeigten Monate neu (z. B. nach Bearbeiten oder Löschen eines Eintrags) */
  refetch(): void {
    this.fetchWorkingEntries(Math.max(INITIAL_MONTHS, this.loadedMonthCount()));
  }

  retry(): void {
    this.fetchWorkingEntries(INITIAL_MONTHS);
  }

  /** Hängt die nächsten Monate mit Einträgen an (immer ganze Monate, damit die Monatssummen stimmen) */
  loadOlder(): void {
    const until = this.nextUntil();
    if (!until || this.loadingOlderState()) {
      return;
    }

    this.loadingOlderState.set(true);

    this.apiService
      .listWorkingEntryMonths(this.personId, until, INITIAL_MONTHS)
      .subscribe(
        {
          next: result => {
            this.loadingOlderState.set(false);
            this.workingEntries$.next([...(this.workingEntries$.value ?? []), ...result.entries]);
            this.nextUntil.set(result.nextUntil);
          },
          // Netz- und Serverfehler meldet der Fehler-Interceptor; die geladenen Monate bleiben stehen
          error: _ => this.loadingOlderState.set(false)
        }
      );
  }

  getById(id: string): WorkingEntryDto | undefined {
    return this.workingEntries$.value?.find(entry => entry.id == id);
  }

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
          this.refetch();
          returnSubject.error(error);
        } 
      }
    );

    return returnSubject.asObservable();
  }

  private loadedMonthCount(): number {
    return new Set((this.workingEntries$.value ?? []).map(entry => monthKey(entry.from))).size;
  }

  private fetchWorkingEntries(months: number) {
    this.loading$.next(true);
    this.errorState.set(false);

    this.apiService
      .listWorkingEntryMonths(this.personId, undefined, months)
      .subscribe(
        {
          next: result => {
            this.loading$.next(false);
            this.workingEntries$.next(result.entries);
            this.nextUntil.set(result.nextUntil);
          },
          error: _ => {
            this.loading$.next(false);
            this.errorState.set(true);
          }
        }
    );
  }
}
