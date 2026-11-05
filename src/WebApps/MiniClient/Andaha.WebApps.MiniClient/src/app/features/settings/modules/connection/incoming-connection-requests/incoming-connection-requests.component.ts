import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConnectionRequestDto } from 'src/app/api/collaboration/dtos/ConnectionRequestDto';
import { CollaborationContextService } from 'src/app/services/collaboration-context.service';
import { LoadState, LoadStateComponent } from 'src/app/shared/load-state/load-state.component';
import { openErrorSnackbar, openSuccessSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-incoming-connection-requests',
    templateUrl: './incoming-connection-requests.component.html',
    styleUrls: ['./incoming-connection-requests.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [LoadStateComponent, MatProgressSpinner]
})
export class IncomingConnectionRequestsComponent implements OnInit {
  private collaborationContextService = inject(CollaborationContextService);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);


  connectionRequests?: ConnectionRequestDto[];

  /** Benutzer-ID der Anfrage, die gerade angenommen oder abgelehnt wird (sperrt beide Buttons der Zeile) */
  busyUserId?: string;
  busyAction?: 'accept' | 'decline';

  get loadState(): LoadState {
    if (this.connectionRequests) {
      return this.connectionRequests.length === 0 ? 'empty' : 'ready';
    }
    return this.collaborationContextService.incomingConnectionRequestsError() ? 'error' : 'loading';
  }

  ngOnInit(): void {
    this.initSubscriptions();
  }

  onRetry(): void {
    this.collaborationContextService.retry();
  }

  onAcceptClick(request: ConnectionRequestDto): void {
    if (this.busyUserId) {
      return;
    }

    this.busyUserId = request.fromUserId;
    this.busyAction = 'accept';

    this.collaborationContextService.acceptRequest(request.fromUserId).subscribe(
      {
        next: _ => {
          this.busyUserId = undefined;
          openSuccessSnackbar(`Verbindung mit ${request.fromUserEmailAddress} hergestellt`, this.snackbar);
        },
        error: _ => {
          this.busyUserId = undefined;
          openErrorSnackbar('Die Anfrage konnte nicht angenommen werden.', this.snackbar);
        }
      }
    );
  }

  onDeclineClick(request: ConnectionRequestDto): void {
    if (this.busyUserId) {
      return;
    }

    this.busyUserId = request.fromUserId;
    this.busyAction = 'decline';

    this.collaborationContextService.declineRequest(request.fromUserId).subscribe(
      {
        next: _ => {
          this.busyUserId = undefined;
          openSuccessSnackbar('Anfrage abgelehnt', this.snackbar);
        },
        error: _ => {
          this.busyUserId = undefined;
          openErrorSnackbar('Die Anfrage konnte nicht abgelehnt werden.', this.snackbar);
        }
      }
    );
  }

  private initSubscriptions(): void {
    this.collaborationContextService.incomingConnectionRequests().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: result => this.connectionRequests = result
      }
    );
  }
}
