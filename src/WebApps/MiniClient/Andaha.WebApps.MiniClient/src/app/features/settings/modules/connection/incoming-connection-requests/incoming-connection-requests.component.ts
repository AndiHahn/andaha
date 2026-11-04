import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ConnectionRequestDto } from 'src/app/api/collaboration/dtos/ConnectionRequestDto';
import { CollaborationContextService } from 'src/app/services/collaboration-context.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-incoming-connection-requests',
    templateUrl: './incoming-connection-requests.component.html',
    styleUrls: ['./incoming-connection-requests.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatProgressSpinner, MatIcon]
})
export class IncomingConnectionRequestsComponent implements OnInit {
  private collaborationContextService = inject(CollaborationContextService);


  loading: boolean = false;
  connectionRequests?: ConnectionRequestDto[];

  ngOnInit(): void {
    this.initSubscriptions();
  }

  onAcceptClick(request: ConnectionRequestDto): void {
    this.collaborationContextService.acceptRequest(request.fromUserId).subscribe(
      {
        next: _ => console.log("acc")
      }
    );
  }

  onDeclineClick(request: ConnectionRequestDto): void {
    this.collaborationContextService.declineRequest(request.fromUserId).subscribe(
      {
        next: _ => console.log("dec")
      }
    );
  }

  private initSubscriptions(): void {
    this.collaborationContextService.incomingConnectionRequests().subscribe(
      {
        next: result => this.connectionRequests = result
      }
    );

    this.collaborationContextService.incomingConnectionRequestsLoading().subscribe(
      {
        next: loading => this.loading = loading
      }
    );
  }
}
