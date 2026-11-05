import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { CollaborationContextService } from 'src/app/services/collaboration-context.service';
import { AddConnectionDialogComponent } from './add-connection-dialog.component';

describe('AddConnectionDialogComponent', () => {
  it('send request shows "Anfrage an … gesendet"', () => {
    const close = vi.fn();
    const requestConnection = vi.fn(() => of(undefined));
    TestBed.configureTestingModule({
      imports: [AddConnectionDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close } },
        { provide: CollaborationContextService, useValue: { requestConnection } }
      ]
    });
    const snackbar = vi.spyOn(TestBed.inject(MatSnackBar), 'openFromComponent').mockReturnValue(undefined as never);
    const fixture = TestBed.createComponent(AddConnectionDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.formGroup.controls['emailAddress'].setValue('oma@mail.at');
    fixture.componentInstance.onSubmitClick();

    expect(requestConnection).toHaveBeenCalledWith('oma@mail.at');
    expect((snackbar.mock.calls[0][1] as { data: string }).data).toBe('Anfrage an oma@mail.at gesendet');
    expect(close).toHaveBeenCalledWith(true);
  });
});
