import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { CollaborationContextService } from 'src/app/services/collaboration-context.service';

@Component({
  selector: 'app-add-connection-dialog',
  templateUrl: './add-connection-dialog.component.html',
  styleUrls: ['./add-connection-dialog.component.scss']
})
export class AddConnectionDialogComponent implements OnInit {

  formGroup: FormGroup;

  isSaving: boolean = false;
  errorMessage?: string;

  constructor(
    private dialogRef: MatDialogRef<AddConnectionDialogComponent>,
    private contextService: CollaborationContextService
  ) {
    this.formGroup = new FormGroup(
      {
        emailAddress: new FormControl('', [ Validators.email ])
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
