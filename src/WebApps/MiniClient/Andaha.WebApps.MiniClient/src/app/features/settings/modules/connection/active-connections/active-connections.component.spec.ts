import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { CollaborationContextService } from 'src/app/services/collaboration-context.service';
import { BudgetplanContextService } from 'src/app/features/budgetplan/services/budgetplan-context.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { ConnectionDto } from 'src/app/api/collaboration/dtos/ConnectionDto';
import { ActiveConnectionsComponent } from './active-connections.component';

describe('ActiveConnectionsComponent', () => {
  let fixture: ComponentFixture<ActiveConnectionsComponent>;
  let host: HTMLElement;
  let list$: BehaviorSubject<ConnectionDto[] | undefined>;
  let error: ReturnType<typeof signal<boolean>>;
  let removeConnection: ReturnType<typeof vi.fn>;
  let retry: ReturnType<typeof vi.fn>;
  let refreshBudget: ReturnType<typeof vi.fn>;
  let openConfirmation: ReturnType<typeof vi.fn>;
  let confirmed: boolean;
  let snackbar: ReturnType<typeof vi.spyOn>;

  const connection: ConnectionDto = { userId: 'u1', userEmailAddress: 'peter@mail.at' };

  function setup(initial: ConnectionDto[] | null = [connection]): void {
    list$ = new BehaviorSubject<ConnectionDto[] | undefined>(initial ?? undefined);
    error = signal(false);
    removeConnection = vi.fn(() => of(undefined));
    retry = vi.fn();
    refreshBudget = vi.fn();
    confirmed = true;
    openConfirmation = vi.fn(() => Promise.resolve({ afterClosed: () => of(confirmed) }));
    TestBed.configureTestingModule({
      imports: [ActiveConnectionsComponent],
      providers: [
        { provide: CollaborationContextService, useValue: { connections: () => list$.asObservable(), connectionsError: error, removeConnection, retry } },
        { provide: BudgetplanContextService, useValue: { refresh: refreshBudget } },
        { provide: ConfirmationDialogService, useValue: { openDialog: openConfirmation } }
      ]
    });
    snackbar = vi.spyOn(TestBed.inject(MatSnackBar), 'openFromComponent').mockReturnValue(undefined as never);
    fixture = TestBed.createComponent(ActiveConnectionsComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();
  }

  const trennen = () => Array.from(host.querySelectorAll('button')).find(b => b.textContent?.includes('Trennen'))!;
  const snackbarText = () => snackbar.mock.calls.map((c: unknown[]) => (c[1] as { data: string }).data).join('|');

  it('remove asks "Verbindung mit … trennen? …" then reloads bills and budget plan', async () => {
    setup();
    const vibrate = vi.spyOn(navigator, 'vibrate').mockImplementation(() => true);

    trennen().click();
    await vi.waitFor(() => expect(removeConnection).toHaveBeenCalledWith('u1'));

    expect(openConfirmation.mock.calls[0][0].text).toBe(
      'Verbindung mit peter@mail.at trennen? Ihr seht danach die Rechnungen, den Haushalt und die Stunden des anderen nicht mehr.');
    expect(refreshBudget).toHaveBeenCalled();
    expect(vibrate).toHaveBeenCalled();
    expect(snackbarText()).toContain('Verbindung mit peter@mail.at getrennt');
    vibrate.mockRestore();
  });

  it('declined confirmation does not remove', async () => {
    setup();
    confirmed = false;

    trennen().click();
    await vi.waitFor(() => expect(openConfirmation).toHaveBeenCalled());
    await Promise.resolve();

    expect(removeConnection).not.toHaveBeenCalled();
  });

  it('error keeps row and shows error snackbar', async () => {
    setup();
    removeConnection.mockReturnValue(throwError(() => new Error('x')));

    trennen().click();
    await vi.waitFor(() => expect(snackbar).toHaveBeenCalled());
    fixture.detectChanges();

    expect(host.querySelectorAll('.crow').length).toBe(1);
    expect(refreshBudget).not.toHaveBeenCalled();
    expect(snackbarText()).toContain('nicht getrennt');
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
    expect(host.querySelector('.empty')?.textContent).toContain('Noch keine Verbindungen');
  });
});
