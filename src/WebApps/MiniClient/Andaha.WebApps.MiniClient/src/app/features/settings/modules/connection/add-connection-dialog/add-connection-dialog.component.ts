import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogContent } from '@angular/material/dialog';
import { CollaborationContextService } from 'src/app/services/collaboration-context.service';
import { DialogComponent } from '../../../../../shared/dialog/dialog.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ShowErrorPipe } from '../../../../../shared/form-field/show-error.pipe';

@Component({
    selector: 'app-add-connection-dialog',
    templateUrl: './add-connection-dialog.component.html',
    styleUrls: ['./add-connection-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [DialogComponent, FormsModule, ReactiveFormsModule, CdkScrollable, MatDialogContent, MatProgressSpinner, ShowErrorPipe]
})
export class AddConnectionDialogComponent implements OnInit {

  formGroup: UntypedFormGroup;

  isSaving: boolean = false;
  errorMessage?: string;

  constructor(
    private dialogRef: MatDialogRef<AddConnectionDialogComponent>,
    private contextService: CollaborationContextService
  ) {
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
          this.dialogRef.close(true);
        },
        error: error => {
          this.isSaving = false
          this.errorMessage = error.error;
        } 
      }
    );
  }
}
