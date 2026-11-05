import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { CollaborationContextService } from 'src/app/services/collaboration-context.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { ConnectionRequestDto } from 'src/app/api/collaboration/dtos/ConnectionRequestDto';
import { OutgoingConnectionRequestsComponent } from './outgoing-connection-requests.component';

describe('OutgoingConnectionRequestsComponent', () => {
  let fixture: ComponentFixture<OutgoingConnectionRequestsComponent>;
  let host: HTMLElement;
  let list$: BehaviorSubject<ConnectionRequestDto[] | undefined>;
  let error: ReturnType<typeof signal<boolean>>;
  let withdrawRequest: ReturnType<typeof vi.fn>;
  let retry: ReturnType<typeof vi.fn>;
  let openConfirmation: ReturnType<typeof vi.fn>;
  let confirmed: boolean;
  let snackbar: ReturnType<typeof vi.spyOn>;

  const request: ConnectionRequestDto = { fromUserId: 'me', fromUserEmailAddress: 'me@mail.at', targetUserId: 'u2', targetUserEmailAddress: 'oma@mail.at', declined: false };

  function setup(initial: ConnectionRequestDto[] | null = [request]): void {
    list$ = new BehaviorSubject<ConnectionRequestDto[] | undefined>(initial ?? undefined);
    error = signal(false);
    withdrawRequest = vi.fn(() => of(undefined));
    retry = vi.fn();
    confirmed = true;
    openConfirmation = vi.fn(() => Promise.resolve({ afterClosed: () => of(confirmed) }));
    TestBed.configureTestingModule({
      imports: [OutgoingConnectionRequestsComponent],
      providers: [
        { provide: CollaborationContextService, useValue: { outgoingConnectionRequests: () => list$.asObservable(), outgoingConnectionRequestsError: error, withdrawRequest, retry } },
        { provide: ConfirmationDialogService, useValue: { openDialog: openConfirmation } }
      ]
    });
    snackbar = vi.spyOn(TestBed.inject(MatSnackBar), 'openFromComponent').mockReturnValue(undefined as never);
    fixture = TestBed.createComponent(OutgoingConnectionRequestsComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();
  }

  const zurueckziehen = () => Array.from(host.querySelectorAll('button')).find(b => b.textContent?.includes('Zurückziehen'))!;
  const snackbarText = () => snackbar.mock.calls.map((c: unknown[]) => (c[1] as { data: string }).data).join('|');

  it('withdraw asks then removes', async () => {
    setup();
    const vibrate = vi.spyOn(navigator, 'vibrate').mockImplementation(() => true);

    zurueckziehen().click();
    await vi.waitFor(() => expect(withdrawRequest).toHaveBeenCalledWith('u2'));

    expect(openConfirmation.mock.calls[0][0].text).toContain('oma@mail.at');
    expect(vibrate).toHaveBeenCalled();
    expect(snackbarText()).toContain('zurückgezogen');
    vibrate.mockRestore();
  });

  it('declined confirmation does not withdraw', async () => {
    setup();
    confirmed = false;

    zurueckziehen().click();
    await vi.waitFor(() => expect(openConfirmation).toHaveBeenCalled());
    await Promise.resolve();

    expect(withdrawRequest).not.toHaveBeenCalled();
  });

  it('error keeps row and shows error snackbar', async () => {
    setup();
    withdrawRequest.mockReturnValue(throwError(() => new Error('x')));

    zurueckziehen().click();
    await vi.waitFor(() => expect(snackbar).toHaveBeenCalled());
    fixture.detectChanges();

    expect(host.querySelectorAll('.crow').length).toBe(1);
    expect(snackbarText()).toContain('nicht zurückgezogen');
  });

  it('loading, error with retry and empty state', () => {
    setup(null);
    expect(host.querySelector('mat-progress-bar')).not.toBeNull();

    error.set(true);
    fixture.detectChanges();
    host.querySelector<HTMLButtonElement>('.state-retry')!.click();
    expect(retry).toHaveBeenCalled();

    list$.next([]);
    fixture.detectChanges();
    expect(host.querySelector('.empty')?.textContent).toContain('Keine gesendeten Anfragen');
  });
});
