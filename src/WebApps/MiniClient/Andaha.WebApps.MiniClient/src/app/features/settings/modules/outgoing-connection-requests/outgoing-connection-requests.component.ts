import { Component, OnInit } from '@angular/core';
import { ConnectionRequestDto } from 'src/app/api/collaboration/dtos/ConnectionRequestDto';
import { CollaborationContextService } from 'src/app/services/collaboration-context.service';

@Component({
  selector: 'app-outgoing-connection-requests',
  templateUrl: './outgoing-connection-requests.component.html',
  styleUrls: ['./outgoing-connection-requests.component.scss']
})
export class OutgoingConnectionRequestsComponent implements OnInit {

  loading: boolean = false;
  connectionRequests?: ConnectionRequestDto[];
  
  constructor(private collaborationContextService: CollaborationContextService) { }

  ngOnInit(): void {
    this.initSubscriptions();
  }

  private initSubscriptions(): void {
    this.collaborationContextService.outgoingConnectionRequests().subscribe(
      {
        next: result => this.connectionRequests = result
      }
    );

    this.collaborationContextService.outgoingConnectionRequestsLoading().subscribe(
      {
        next: loading => this.loading = loading
      }
    );
  }
}
