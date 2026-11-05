import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogContent } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { openSuccessSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { CollaborationContextService } from 'src/app/services/collaboration-context.service';
import { DialogComponent } from '../../../../../shared/dialog/dialog.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ShowErrorPipe } from '../../../../../shared/form-field/show-error.pipe';

const GENERIC_ERROR = 'Anfrage konnte nicht gesendet werden. Bitte später erneut versuchen.';
const NOT_FOUND_ERROR = 'Kein Benutzer mit dieser E-Mail-Adresse gefunden.';
const ALREADY_CONNECTED_ERROR = 'Es gibt bereits eine Verbindung oder offene Anfrage zu diesem Benutzer.';

/**
 * Deutscher Text nach Status (Backend: 404 „User not found“, 400 „already a connection request“).
 * Der Servertext wird nie angezeigt, damit keine Interna oder englischen Texte erscheinen.
 */
function userFacingMessage(error: { status?: number }): string {
  switch (error?.status) {
    case 404: return NOT_FOUND_ERROR;
    case 400: return ALREADY_CONNECTED_ERROR;
    default: return GENERIC_ERROR;
  }
}

@Component({
    selector: 'app-add-connection-dialog',
    templateUrl: './add-connection-dialog.component.html',
    styleUrls: ['./add-connection-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [DialogComponent, FormsModule, ReactiveFormsModule, CdkScrollable, MatDialogContent, MatProgressSpinner, ShowErrorPipe]
})
export class AddConnectionDialogComponent implements OnInit {
  private dialogRef = inject<MatDialogRef<AddConnectionDialogComponent>>(MatDialogRef);
  private contextService = inject(CollaborationContextService);
  private snackbar = inject(MatSnackBar);


  formGroup: UntypedFormGroup;

  isSaving: boolean = false;
  errorMessage?: string;

  constructor() {
    this.formGroup = new UntypedFormGroup(
      {
        emailAddress: new UntypedFormControl('', [ Validators.email ])
      }
    );
  }

  ngOnInit(): void {
  }

  onSubmitClick(): void {
    if (!this.formGroup.valid) {
      return;
    }

    const controls = this.formGroup.controls;

    this.requestConnection(controls['emailAddress'].value);
  }

  private requestConnection(userEmailAddress: string): void {
    this.isSaving = true;

    this.contextService.requestConnection(userEmailAddress).subscribe(
      {
        next: _ => {
          this.isSaving = false;
          openSuccessSnackbar(`Anfrage an ${userEmailAddress} gesendet`, this.snackbar);
          this.dialogRef.close(true);
        },
        error: error => {
          this.isSaving = false;
          this.errorMessage = userFacingMessage(error);
        } 
      }
    );
  }
}
