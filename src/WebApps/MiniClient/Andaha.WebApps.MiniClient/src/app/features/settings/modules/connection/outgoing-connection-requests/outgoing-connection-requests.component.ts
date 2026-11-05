import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ConnectionRequestDto } from 'src/app/api/collaboration/dtos/ConnectionRequestDto';
import { CollaborationContextService } from 'src/app/services/collaboration-context.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { LoadState, LoadStateComponent } from 'src/app/shared/load-state/load-state.component';
import { openErrorSnackbar, openSuccessSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { vibrate } from 'src/app/shared/utils/haptics';

@Component({
    selector: 'app-outgoing-connection-requests',
    templateUrl: './outgoing-connection-requests.component.html',
    styleUrls: ['./outgoing-connection-requests.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [LoadStateComponent, MatProgressSpinner]
})
export class OutgoingConnectionRequestsComponent implements OnInit {
  private collaborationContextService = inject(CollaborationContextService);
  private confirmationDialog = inject(ConfirmationDialogService);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);


  connectionRequests?: ConnectionRequestDto[];

  /** Zielbenutzer der Anfrage, die gerade zurückgezogen wird */
  busyTargetUserId?: string;

  get loadState(): LoadState {
    if (this.connectionRequests) {
      return this.connectionRequests.length === 0 ? 'empty' : 'ready';
    }
    return this.collaborationContextService.outgoingConnectionRequestsError() ? 'error' : 'loading';
  }

  ngOnInit(): void {
    this.initSubscriptions();
  }

  onRetry(): void {
    this.collaborationContextService.retry();
  }

  async onWithdrawClick(request: ConnectionRequestDto): Promise<void> {
    if (this.busyTargetUserId) {
      return;
    }

    // Rückfrage vor dem Zurückziehen (AC26)
    const dialogRef = await this.confirmationDialog.openDialog({
      text: `Anfrage an ${request.targetUserEmailAddress} zurückziehen?`
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.withdraw(request);
      }
    });
  }

  private withdraw(request: ConnectionRequestDto): void {
    this.busyTargetUserId = request.targetUserId;

    this.collaborationContextService.withdrawRequest(request.targetUserId).subscribe(
      {
        next: _ => {
          this.busyTargetUserId = undefined;
          vibrate();
          openSuccessSnackbar(`Anfrage an ${request.targetUserEmailAddress} zurückgezogen`, this.snackbar);
        },
        error: _ => {
          this.busyTargetUserId = undefined;
          openErrorSnackbar('Die Anfrage konnte nicht zurückgezogen werden.', this.snackbar);
        }
      }
    );
  }

  private initSubscriptions(): void {
    this.collaborationContextService.outgoingConnectionRequests().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: result => this.connectionRequests = result
      }
    );
  }
}
