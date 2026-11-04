import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ConnectionDto } from 'src/app/api/collaboration/dtos/ConnectionDto';
import { CollaborationContextService } from 'src/app/services/collaboration-context.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-active-connections',
    templateUrl: './active-connections.component.html',
    styleUrls: ['./active-connections.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatProgressSpinner]
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
