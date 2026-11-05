import { Injectable, Signal, WritableSignal, inject, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { CollaborationApiService } from '../api/collaboration/collaboration-api.service';
import { ConnectionDto } from '../api/collaboration/dtos/ConnectionDto';
import { ConnectionRequestDto } from '../api/collaboration/dtos/ConnectionRequestDto';
import { ContextService } from '../core/context.service';
import { BillContextService } from '../features/bill/services/bill-context.service';

@Injectable({
  providedIn: 'root'
})
export class CollaborationContextService {
  private contextService = inject(ContextService);
  private billContextService = inject(BillContextService);
  private collaborationApiService = inject(CollaborationApiService);

  private connections$: BehaviorSubject<ConnectionDto[] | undefined> = new BehaviorSubject<ConnectionDto[] | undefined>(undefined);
  private connectionsLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private incomingConnectionRequests$: BehaviorSubject<ConnectionRequestDto[] | undefined> = new BehaviorSubject<ConnectionRequestDto[] | undefined>(undefined);
  private incomingConnectionRequestsLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  
  private outgoingConnectionRequests$: BehaviorSubject<ConnectionRequestDto[] | undefined> = new BehaviorSubject<ConnectionRequestDto[] | undefined>(undefined);
  private outgoingConnectionRequestsLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private readonly connectionsErrorState = signal(false);
  private readonly incomingConnectionRequestsErrorState = signal(false);
  private readonly outgoingConnectionRequestsErrorState = signal(false);
  private backendIsReady: boolean = false;

  /** true, wenn das letzte Laden der jeweiligen Liste fehlgeschlagen ist (nachdem das Backend bereit war) oder das Backend nicht erreichbar ist */
  readonly connectionsError: Signal<boolean> = computed(() => this.connectionsErrorState() || this.contextService.backendUnreachable());
  readonly incomingConnectionRequestsError: Signal<boolean> = computed(() => this.incomingConnectionRequestsErrorState() || this.contextService.backendUnreachable());
  readonly outgoingConnectionRequestsError: Signal<boolean> = computed(() => this.outgoingConnectionRequestsErrorState() || this.contextService.backendUnreachable());

  constructor() {
    this.initSubscriptions();
    this.fetchConnections();
    this.fetchIncomingConnectionRequests();
    this.fetchOutgoingConnectionRequests();
  }

  connectionsLoading(): Observable<boolean> {
    return this.connectionsLoading$.asObservable();
  }

  connections(): Observable<ConnectionDto[] | undefined> {
    return this.connections$.asObservable();
  }

  incomingConnectionRequestsLoading(): Observable<boolean> {
    return this.incomingConnectionRequestsLoading$.asObservable();
  }

  incomingConnectionRequests(): Observable<ConnectionRequestDto[] | undefined> {
    return this.incomingConnectionRequests$.asObservable();
  }

  outgoingConnectionRequestsLoading(): Observable<boolean> {
    return this.outgoingConnectionRequestsLoading$.asObservable();
  }

  outgoingConnectionRequests(): Observable<ConnectionRequestDto[] | undefined> {
    return this.outgoingConnectionRequests$.asObservable();
  }

  /** Alle drei Listen erneut laden (bzw. Backend erneut wecken, solange es nicht bereit ist) */
  retry(): void {
    if (!this.backendIsReady) {
      this.contextService.retryWakeUp();
      return;
    }

    this.fetchConnections();
    this.fetchIncomingConnectionRequests();
    this.fetchOutgoingConnectionRequests();
  }

  requestConnection(targetUserEmailAddress: string): Observable<void> {
    const returnSubject = new Subject<void>();

    this.collaborationApiService.requestConnection( { targetUserEmailAddress: targetUserEmailAddress }).subscribe(
      {
        next: _ => {
          this.fetchOutgoingConnectionRequests();
          returnSubject.next();
        },
        error: error => returnSubject.error(error)
      }
    );

    return returnSubject.asObservable();
  }

  acceptRequest(fromUserId: string): Observable<void> {
    const returnSubject = new Subject<void>();

    this.collaborationApiService.acceptRequest(fromUserId).subscribe(
      {
        next: _ => {
          returnSubject.next();
          this.fetchIncomingConnectionRequests();
          this.fetchConnections();
          this.billContextService.refreshBills();
        },
        error: error => returnSubject.error(error)
      }
    );

    return returnSubject.asObservable();
  }

  declineRequest(fromUserId: string): Observable<void> {
    const returnSubject = new Subject<void>();

    this.collaborationApiService.declineRequest(fromUserId).subscribe(
      {
        next: _ => {
          returnSubject.next();
          this.fetchIncomingConnectionRequests();
        },
        error: error => returnSubject.error(error)
      }
    );

    return returnSubject.asObservable();
  }

  /**
   * Verbindung trennen. Danach werden Verbindungen und Rechnungen neu geladen; den Haushaltsplan lädt
   * der Aufrufer über `BudgetplanContextService.refresh()` neu. Der Aufrufer zeigt Fehler selbst an.
   */
  removeConnection(userId: string): Observable<void> {
    const returnSubject = new Subject<void>();

    this.collaborationApiService.removeConnection(userId).subscribe(
      {
        next: _ => {
          returnSubject.next();
          this.fetchConnections();
          this.billContextService.refreshBills();
        },
        error: error => returnSubject.error(error)
      }
    );

    return returnSubject.asObservable();
  }

  /** Eigene offene Anfrage zurückziehen; danach werden die ausgehenden Anfragen neu geladen */
  withdrawRequest(targetUserId: string): Observable<void> {
    const returnSubject = new Subject<void>();

    this.collaborationApiService.withdrawRequest(targetUserId).subscribe(
      {
        next: _ => {
          returnSubject.next();
          this.fetchOutgoingConnectionRequests();
        },
        error: error => returnSubject.error(error)
      }
    );

    return returnSubject.asObservable();
  }

  private initSubscriptions(): void {
    this.contextService.backendReady().subscribe(
      {
        next: ready => {
          this.backendIsReady = ready;
          if (ready) {
            this.fetchConnections();
            this.fetchIncomingConnectionRequests();
            this.fetchOutgoingConnectionRequests();
          }
        } 
      }
    );
  }

  private fetchConnections() {
    this.fetchList(
      this.collaborationApiService.listConnections(),
      this.connections$,
      this.connectionsLoading$,
      this.connectionsErrorState);
  }

  private fetchIncomingConnectionRequests() {
    this.fetchList(
      this.collaborationApiService.listIncomingConnectionRequests(),
      this.incomingConnectionRequests$,
      this.incomingConnectionRequestsLoading$,
      this.incomingConnectionRequestsErrorState);
  }

  private fetchOutgoingConnectionRequests() {
    this.fetchList(
      this.collaborationApiService.listOutgoingConnectionRequests(),
      this.outgoingConnectionRequests$,
      this.outgoingConnectionRequestsLoading$,
      this.outgoingConnectionRequestsErrorState);
  }

  private fetchList<T>(
    request: Observable<T[]>,
    list$: BehaviorSubject<T[] | undefined>,
    loading$: BehaviorSubject<boolean>,
    errorState: WritableSignal<boolean>) {
    loading$.next(true);
    errorState.set(false);

    request.subscribe(
      {
        next: result => {
          loading$.next(false);
          list$.next(result);
        },
        error: _ => {
          loading$.next(false);
          if (this.backendIsReady) {
            errorState.set(true);
          }
        }
      }
    );
  }
}
