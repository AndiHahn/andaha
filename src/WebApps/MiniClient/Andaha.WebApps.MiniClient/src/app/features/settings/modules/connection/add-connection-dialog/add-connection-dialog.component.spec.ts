import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { CollaborationContextService } from 'src/app/services/collaboration-context.service';
import { AddConnectionDialogComponent } from './add-connection-dialog.component';

describe('AddConnectionDialogComponent', () => {
  let fixture: ComponentFixture<AddConnectionDialogComponent>;
  let close: ReturnType<typeof vi.fn>;
  let requestConnection: ReturnType<typeof vi.fn>;
  let snackbar: ReturnType<typeof vi.spyOn>;

  function setup(): void {
    close = vi.fn();
    requestConnection = vi.fn(() => of(undefined));
    TestBed.configureTestingModule({
      imports: [AddConnectionDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close } },
        { provide: CollaborationContextService, useValue: { requestConnection } }
      ]
    });
    snackbar = vi.spyOn(TestBed.inject(MatSnackBar), 'openFromComponent').mockReturnValue(undefined as never);
    fixture = TestBed.createComponent(AddConnectionDialogComponent);
    fixture.detectChanges();
  }

  function submit(): void {
    fixture.componentInstance.formGroup.controls['emailAddress'].setValue('oma@mail.at');
    fixture.componentInstance.onSubmitClick();
    fixture.detectChanges();
  }

  const alertText = () => fixture.nativeElement.querySelector('[role="alert"]')?.textContent ?? '';

  it('send request shows "Anfrage an … gesendet"', () => {
    setup();

    submit();

    expect(requestConnection).toHaveBeenCalledWith('oma@mail.at');
    expect((snackbar.mock.calls[0][1] as { data: string }).data).toBe('Anfrage an oma@mail.at gesendet');
    expect(close).toHaveBeenCalledWith(true);
  });

  it.each([[404, 'User not found'], [400, 'There is already a connection request to this user.']])(
    '%i with a short message shows the server text in the dialog only',
    (status, message) => {
      setup();
      requestConnection.mockReturnValue(throwError(() => new HttpErrorResponse({ status, error: message })));

      submit();

      expect(alertText()).toContain(message);
      expect(close).not.toHaveBeenCalled();
      expect(snackbar).not.toHaveBeenCalled();
    });

  it('500 with a stack trace shows a generic text and no internals', () => {
    setup();
    const trace = 'System.InvalidOperationException: boom\n   at Andaha.Services.Collaboration.Handler.Handle() in C:\\src\\Handler.cs:line 42';
    requestConnection.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500, error: trace })));

    submit();

    expect(alertText()).toContain('Anfrage konnte nicht gesendet werden. Bitte später erneut versuchen.');
    expect(fixture.nativeElement.textContent).not.toContain('InvalidOperationException');
    expect(fixture.nativeElement.textContent).not.toContain('Handler.cs');
    expect(snackbar).not.toHaveBeenCalled();
  });

  it('status 0 and long 4xx bodies show the generic text', () => {
    setup();
    requestConnection.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') })));
    submit();
    expect(alertText()).toContain('Bitte später erneut versuchen.');

    requestConnection.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400, error: 'x'.repeat(500) })));
    submit();
    expect(alertText()).not.toContain('xxxx');
  });
});
