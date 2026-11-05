import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserDataApiService } from 'src/app/api/user-data/user-data-api.service';
import { AuthService } from 'src/app/core/auth.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { getDialogBaseConfig } from 'src/app/shared/dialog/dialog-functions';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { vibrate } from 'src/app/shared/utils/haptics';
import { BillCacheService } from 'src/app/features/bill/services/bill-cache.service';
import { DeleteConfirmDialogComponent } from './delete-confirm-dialog/delete-confirm-dialog.component';

export const DELETE_ALL_CONFIRMATION_TEXT =
  'Sollen wirklich alle Daten gelöscht werden? Rechnungen, Fotos, Kategorien, Vorlagen, Haushalt, Stunden und Verbindungen werden gelöscht. Das Login-Konto bleibt bestehen.';
export const DELETE_ALL_FAILED = 'Löschen nicht vollständig. Bitte erneut versuchen.';

@Component({
  selector: 'app-user-data',
  templateUrl: './user-data.component.html',
  styleUrls: ['./user-data.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatProgressSpinner]
})
export class UserDataComponent {
  private userDataApiService = inject(UserDataApiService);
  private authService = inject(AuthService);
  private confirmationDialog = inject(ConfirmationDialogService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private billCacheService = inject(BillCacheService);

  /** true, solange gelöscht wird; sperrt den Button */
  readonly deleting = signal(false);

  /** Rückfrage 1 (Aufzählung), Rückfrage 2 (LÖSCHEN eintippen), dann löschen und abmelden */
  async onDeleteClick(): Promise<void> {
    if (this.deleting()) {
      return;
    }

    const firstDialog = await this.confirmationDialog.openDialog({ text: DELETE_ALL_CONFIRMATION_TEXT });
    firstDialog.afterClosed().subscribe(firstConfirmed => {
      if (!firstConfirmed) {
        return;
      }

      this.dialog
        .open<DeleteConfirmDialogComponent, void, boolean>(DeleteConfirmDialogComponent, getDialogBaseConfig())
        .afterClosed()
        .subscribe(finalConfirmed => {
          if (finalConfirmed) {
            this.deleteAll();
          }
        });
    });
  }

  private deleteAll(): void {
    this.deleting.set(true);

    this.userDataApiService.deleteAll().subscribe({
      next: async () => {
        vibrate();
        // noch wartende Offline-Rechnungen (US-0005) nicht nach der nächsten Anmeldung hochladen
        try {
          await this.billCacheService.clearLocal();
        } catch (error) {
          console.error('Clearing the local bill queue failed', error);
        }
        this.authService.logout();
      },
      error: () => {
        this.deleting.set(false);
        openErrorSnackbar(DELETE_ALL_FAILED, this.snackbar);
      }
    });
  }
}
