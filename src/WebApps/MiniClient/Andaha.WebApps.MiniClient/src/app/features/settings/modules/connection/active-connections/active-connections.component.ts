import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ConnectionDto } from 'src/app/api/collaboration/dtos/ConnectionDto';
import { BudgetplanContextService } from 'src/app/features/budgetplan/services/budgetplan-context.service';
import { CollaborationContextService } from 'src/app/services/collaboration-context.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { LoadState, LoadStateComponent } from 'src/app/shared/load-state/load-state.component';
import { openErrorSnackbar, openSuccessSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { vibrate } from 'src/app/shared/utils/haptics';

@Component({
    selector: 'app-active-connections',
    templateUrl: './active-connections.component.html',
    styleUrls: ['./active-connections.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [LoadStateComponent, MatProgressSpinner]
})
export class ActiveConnectionsComponent implements OnInit {
  private collaborationContextService = inject(CollaborationContextService);
  private budgetplanContextService = inject(BudgetplanContextService);
  private confirmationDialog = inject(ConfirmationDialogService);
  private snackbar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);


  connections?: ConnectionDto[];

  /** Benutzer-ID der Verbindung, die gerade getrennt wird */
  busyUserId?: string;

  get loadState(): LoadState {
    if (this.connections) {
      return this.connections.length === 0 ? 'empty' : 'ready';
    }
    return this.collaborationContextService.connectionsError() ? 'error' : 'loading';
  }

  ngOnInit(): void {
    this.initSubscriptions();
  }

  onRetry(): void {
    this.collaborationContextService.retry();
  }

  async onRemoveClick(connection: ConnectionDto): Promise<void> {
    if (this.busyUserId) {
      return;
    }

    // Rückfrage vor dem Trennen (AC26)
    const dialogRef = await this.confirmationDialog.openDialog({
      text: `Verbindung mit ${connection.userEmailAddress} trennen? Ihr seht danach die Rechnungen, den Haushalt und die Stunden des anderen nicht mehr.`
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.removeConnection(connection);
      }
    });
  }

  private removeConnection(connection: ConnectionDto): void {
    this.busyUserId = connection.userId;

    this.collaborationContextService.removeConnection(connection.userId).subscribe(
      {
        next: _ => {
          this.busyUserId = undefined;
          // Haushalt des Partners ist nicht mehr sichtbar: neu laden (Rechnungen lädt der Service)
          this.budgetplanContextService.refresh();
          vibrate();
          openSuccessSnackbar(`Verbindung mit ${connection.userEmailAddress} getrennt`, this.snackbar);
        },
        error: _ => {
          this.busyUserId = undefined;
          openErrorSnackbar('Die Verbindung konnte nicht getrennt werden.', this.snackbar);
        }
      }
    );
  }

  private initSubscriptions(): void {
    this.collaborationContextService.connections().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: result => this.connections = result
      }
    );
  }
}
