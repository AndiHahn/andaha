import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { CollaborationApiService } from '../api/collaboration/collaboration-api.service';
import { ConnectionDto } from '../api/collaboration/dtos/ConnectionDto';
import { ConnectionRequestDto } from '../api/collaboration/dtos/ConnectionRequestDto';
import { ContextService } from '../core/context.service';
import { BillContextService } from './bill-context.service';

@Injectable({
  providedIn: 'root'
})
export class CollaborationContextService {
  private connections$: BehaviorSubject<ConnectionDto[] | undefined> = new BehaviorSubject<ConnectionDto[] | undefined>(undefined);
  private connectionsLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private incomingConnectionRequests$: BehaviorSubject<ConnectionRequestDto[] | undefined> = new BehaviorSubject<ConnectionRequestDto[] | undefined>(undefined);
  private incomingConnectionRequestsLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  
  private outgoingConnectionRequests$: BehaviorSubject<ConnectionRequestDto[] | undefined> = new BehaviorSubject<ConnectionRequestDto[] | undefined>(undefined);
  private outgoingConnectionRequestsLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(
    private contextService: ContextService,
    private billContextService: BillContextService,
    private collaborationApiService: CollaborationApiService) {
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

  private initSubscriptions(): void {
    this.contextService.backendReady().subscribe(
      {
        next: ready => {
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
    this.connectionsLoading$.next(true);

    this.collaborationApiService
      .listConnections()
      .subscribe(
        {
          next: result => {
            this.connectionsLoading$.next(false);
            this.connections$.next(result);
          },
          error: _ => this.connectionsLoading$.next(false)
        }
    );
  }

  private fetchIncomingConnectionRequests() {
    this.incomingConnectionRequestsLoading$.next(true);

    this.collaborationApiService
      .listIncomingConnectionRequests()
      .subscribe(
        {
          next: result => {
            this.incomingConnectionRequestsLoading$.next(false);
            this.incomingConnectionRequests$.next(result);
          },
          error: _ => this.incomingConnectionRequestsLoading$.next(false)
        }
    );
  }

  private fetchOutgoingConnectionRequests() {
    this.outgoingConnectionRequestsLoading$.next(true);

    this.collaborationApiService
      .listOutgoingConnectionRequests()
      .subscribe(
        {
          next: result => {
            this.outgoingConnectionRequestsLoading$.next(false);
            this.outgoingConnectionRequests$.next(result);
          },
          error: _ => this.outgoingConnectionRequestsLoading$.next(false)
        }
    );
  }
}
