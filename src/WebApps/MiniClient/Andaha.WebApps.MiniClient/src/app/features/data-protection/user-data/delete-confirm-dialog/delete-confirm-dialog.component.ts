import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { DialogComponent } from 'src/app/shared/dialog/dialog.component';

/** Das Wort, das der Benutzer zur zweiten Bestätigung eintippen muss */
export const DELETE_CONFIRM_WORD = 'LÖSCHEN';

/** Zweite Rückfrage beim Löschen aller Benutzerdaten (Mockup 03 D); schließt mit `true`, wenn bestätigt. */
@Component({
  selector: 'app-delete-confirm-dialog',
  templateUrl: './delete-confirm-dialog.component.html',
  styleUrls: ['./delete-confirm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [DialogComponent, CdkScrollable, MatDialogContent]
})
export class DeleteConfirmDialogComponent {
  private dialogRef = inject<MatDialogRef<DeleteConfirmDialogComponent, boolean>>(MatDialogRef);

  readonly confirmWord = DELETE_CONFIRM_WORD;
  readonly typed = signal('');
  readonly canConfirm = computed(() => this.typed() === DELETE_CONFIRM_WORD);

  onInput(event: Event): void {
    this.typed.set((event.target as HTMLInputElement).value);
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  onConfirmClick(): void {
    if (this.canConfirm()) {
      this.dialogRef.close(true);
    }
  }
}
