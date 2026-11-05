import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { CollaborationContextService } from 'src/app/services/collaboration-context.service';
import { ConnectionRequestDto } from 'src/app/api/collaboration/dtos/ConnectionRequestDto';
import { IncomingConnectionRequestsComponent } from './incoming-connection-requests.component';

describe('IncomingConnectionRequestsComponent', () => {
  let fixture: ComponentFixture<IncomingConnectionRequestsComponent>;
  let host: HTMLElement;
  let list$: BehaviorSubject<ConnectionRequestDto[] | undefined>;
  let error: ReturnType<typeof signal<boolean>>;
  let acceptRequest: ReturnType<typeof vi.fn>;
  let declineRequest: ReturnType<typeof vi.fn>;
  let retry: ReturnType<typeof vi.fn>;
  let snackbar: ReturnType<typeof vi.spyOn>;

  const request: ConnectionRequestDto = { fromUserId: 'u1', fromUserEmailAddress: 'eva@mail.at', targetUserId: 'me', targetUserEmailAddress: 'me@mail.at', declined: false };

  function setup(initial: ConnectionRequestDto[] | null = [request]): void {
    list$ = new BehaviorSubject<ConnectionRequestDto[] | undefined>(initial ?? undefined);
    error = signal(false);
    acceptRequest = vi.fn(() => of(undefined));
    declineRequest = vi.fn(() => of(undefined));
    retry = vi.fn();
    TestBed.configureTestingModule({
      imports: [IncomingConnectionRequestsComponent],
      providers: [{
        provide: CollaborationContextService,
        useValue: { acceptRequest, declineRequest, retry, incomingConnectionRequests: () => list$.asObservable(), incomingConnectionRequestsError: error }
      }]
    });
    snackbar = vi.spyOn(TestBed.inject(MatSnackBar), 'openFromComponent').mockReturnValue(undefined as never);
    fixture = TestBed.createComponent(IncomingConnectionRequestsComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();
  }

  const button = (text: string) => Array.from(host.querySelectorAll('button')).find(b => b.textContent?.includes(text))!;
  const snackbarText = () => snackbar.mock.calls.map((c: unknown[]) => (c[1] as { data: string }).data).join('|');

  it('accept shows spinner, disables row and shows "Verbindung mit … hergestellt"', () => {
    setup();
    const pending = new Subject<void>();
    acceptRequest.mockReturnValue(pending);

    button('Annehmen').click();
    fixture.detectChanges();

    expect(host.querySelector('mat-spinner')).not.toBeNull();
    expect(button('Annehmen').disabled).toBe(true);
    expect(button('Ablehnen').disabled).toBe(true);

    pending.next();
    fixture.detectChanges();

    expect(button('Annehmen').disabled).toBe(false);
    expect(snackbarText()).toContain('Verbindung mit eva@mail.at hergestellt');
  });

  it('decline shows "Anfrage abgelehnt"', () => {
    setup();

    button('Ablehnen').click();

    expect(declineRequest).toHaveBeenCalledWith('u1');
    expect(snackbarText()).toContain('Anfrage abgelehnt');
  });

  it('error keeps row and shows error snackbar', () => {
    setup();
    acceptRequest.mockReturnValue(throwError(() => new Error('x')));

    button('Annehmen').click();
    fixture.detectChanges();

    expect(host.querySelectorAll('.crow').length).toBe(1);
    expect(button('Annehmen').disabled).toBe(false);
    expect(snackbarText()).toContain('nicht angenommen');
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
    expect(host.querySelector('.empty')?.textContent).toContain('Keine eingehenden Anfragen');
  });
});
