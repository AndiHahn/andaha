import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  private collaborationContextService = inject(CollaborationContextService);
  private destroyRef = inject(DestroyRef);


  loading: boolean = false;
  connections?: ConnectionDto[];

  ngOnInit(): void {
    this.initSubscriptions();
  }

  private initSubscriptions(): void {
    this.collaborationContextService.connections().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: result => this.connections = result
      }
    );

    this.collaborationContextService.connectionsLoading().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: loading => this.loading = loading
      }
    );
  }
}
