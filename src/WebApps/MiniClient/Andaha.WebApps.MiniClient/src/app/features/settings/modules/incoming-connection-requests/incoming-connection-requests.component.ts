import { Component, OnInit } from '@angular/core';
import { ConnectionRequestDto } from 'src/app/api/collaboration/dtos/ConnectionRequestDto';
import { CollaborationContextService } from 'src/app/services/collaboration-context.service';

@Component({
  selector: 'app-incoming-connection-requests',
  templateUrl: './incoming-connection-requests.component.html',
  styleUrls: ['./incoming-connection-requests.component.scss']
})
export class IncomingConnectionRequestsComponent implements OnInit {

  loading: boolean = false;
  connectionRequests?: ConnectionRequestDto[];
  
  constructor(private collaborationContextService: CollaborationContextService) { }

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
