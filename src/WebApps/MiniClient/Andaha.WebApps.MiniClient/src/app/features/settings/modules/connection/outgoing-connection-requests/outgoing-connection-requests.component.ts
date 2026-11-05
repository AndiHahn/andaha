import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConnectionRequestDto } from 'src/app/api/collaboration/dtos/ConnectionRequestDto';
import { CollaborationContextService } from 'src/app/services/collaboration-context.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-outgoing-connection-requests',
    templateUrl: './outgoing-connection-requests.component.html',
    styleUrls: ['./outgoing-connection-requests.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatProgressSpinner]
})
export class OutgoingConnectionRequestsComponent implements OnInit {
  private collaborationContextService = inject(CollaborationContextService);
  private destroyRef = inject(DestroyRef);


  loading: boolean = false;
  connectionRequests?: ConnectionRequestDto[];

  ngOnInit(): void {
    this.initSubscriptions();
  }

  private initSubscriptions(): void {
    this.collaborationContextService.outgoingConnectionRequests().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: result => this.connectionRequests = result
      }
    );

    this.collaborationContextService.outgoingConnectionRequestsLoading().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: loading => this.loading = loading
      }
    );
  }
}
