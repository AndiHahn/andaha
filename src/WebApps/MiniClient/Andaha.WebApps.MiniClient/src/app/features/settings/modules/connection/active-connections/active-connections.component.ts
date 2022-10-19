import { Component, OnInit } from '@angular/core';
import { ConnectionDto } from 'src/app/api/collaboration/dtos/ConnectionDto';
import { CollaborationContextService } from 'src/app/services/collaboration-context.service';

@Component({
  selector: 'app-active-connections',
  templateUrl: './active-connections.component.html',
  styleUrls: ['./active-connections.component.scss']
})
export class ActiveConnectionsComponent implements OnInit {

  loading: boolean = false;
  connections?: ConnectionDto[];
  
  constructor(private collaborationContextService: CollaborationContextService) { }

  ngOnInit(): void {
    this.initSubscriptions();
  }

  private initSubscriptions(): void {
    this.collaborationContextService.connections().subscribe(
      {
        next: result => this.connections = result
      }
    );

    this.collaborationContextService.connectionsLoading().subscribe(
      {
        next: loading => this.loading = loading
      }
    );
  }
}
