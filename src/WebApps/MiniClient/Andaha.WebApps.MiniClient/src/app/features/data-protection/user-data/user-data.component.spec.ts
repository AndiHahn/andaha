import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subject, of, throwError } from 'rxjs';
import { UserDataApiService } from 'src/app/api/user-data/user-data-api.service';
import { AuthService } from 'src/app/core/auth.service';
import { BillCacheService } from 'src/app/features/bill/services/bill-cache.service';
import { BillContextService } from 'src/app/features/bill/services/bill-context.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { DELETE_ALL_FAILED, UserDataComponent } from './user-data.component';

describe('UserDataComponent', () => {
  let fixture: ComponentFixture<UserDataComponent>;
  let host: HTMLElement;
  let firstConfirmed: boolean;
  let finalConfirmed: boolean;
  let openConfirmation: ReturnType<typeof vi.fn>;
  let openFinal: ReturnType<typeof vi.fn>;
  let deleteAll: ReturnType<typeof vi.fn>;
  let logout: ReturnType<typeof vi.fn>;
  let openFromComponent: ReturnType<typeof vi.fn>;
  let clearLocal: ReturnType<typeof vi.fn>;
  let clearPendingSync: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    firstConfirmed = true;
    finalConfirmed = true;
    openConfirmation = vi.fn(() => Promise.resolve({ afterClosed: () => of(firstConfirmed || undefined) }));
    openFinal = vi.fn(() => ({ afterClosed: () => of(finalConfirmed || undefined) }));
    deleteAll = vi.fn(() => of(undefined));
    logout = vi.fn();
    openFromComponent = vi.fn();
    clearLocal = vi.fn(() => Promise.resolve());
    clearPendingSync = vi.fn();

    await TestBed.configureTestingModule({
      imports: [UserDataComponent],
      providers: [
        { provide: ConfirmationDialogService, useValue: { openDialog: openConfirmation } },
        { provide: MatDialog, useValue: { open: openFinal } },
        { provide: UserDataApiService, useValue: { deleteAll } },
        { provide: AuthService, useValue: { logout } },
        { provide: MatSnackBar, useValue: { openFromComponent } },
        { provide: BillCacheService, useValue: { clearLocal } },
        { provide: BillContextService, useValue: { clearPendingSync } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserDataComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();
  });

  function deleteButton(): HTMLButtonElement {
    return host.querySelector('button.del') as HTMLButtonElement;
  }

  async function clickDelete(): Promise<void> {
    deleteButton().click();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('first confirm lists what is deleted', async () => {
    await clickDelete();

    const text: string = openConfirmation.mock.calls[0][0].text;
    for (const part of ['Rechnungen', 'Fotos', 'Kategorien', 'Vorlagen', 'Haushalt', 'Stunden', 'Verbindungen']) {
      expect(text).toContain(part);
    }
    expect(openFinal).toHaveBeenCalledTimes(1);
  });

  it('declining the first question deletes nothing', async () => {
    firstConfirmed = false;

    await clickDelete();

    expect(openFinal).not.toHaveBeenCalled();
    expect(deleteAll).not.toHaveBeenCalled();
  });

  it('declining the second question deletes nothing', async () => {
    finalConfirmed = false;

    await clickDelete();

    expect(deleteAll).not.toHaveBeenCalled();
    expect(logout).not.toHaveBeenCalled();
  });

  it('success logs out', async () => {
    await clickDelete();

    expect(deleteAll).toHaveBeenCalledTimes(1);
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('success clears the local offline bill queue before logging out', async () => {
    await clickDelete();

    expect(clearLocal).toHaveBeenCalledTimes(1);
    expect(clearLocal.mock.invocationCallOrder[0]).toBeLessThan(logout.mock.invocationCallOrder[0]);
  });

  it('success also forgets the pending-sync marks of the bill list', async () => {
    await clickDelete();

    expect(clearPendingSync).toHaveBeenCalledTimes(1);
    expect(clearLocal.mock.invocationCallOrder[0]).toBeLessThan(clearPendingSync.mock.invocationCallOrder[0]);
  });

  it('failure keeps the pending-sync marks', async () => {
    deleteAll.mockReturnValue(throwError(() => new Error('boom')));

    await clickDelete();

    expect(clearPendingSync).not.toHaveBeenCalled();
  });

  it('clearing the local queue fails: still logs out', async () => {
    clearLocal.mockRejectedValue(new Error('IndexedDB is not available'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await clickDelete();

    expect(logout).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });

  it('failure keeps the local offline bill queue', async () => {
    deleteAll.mockReturnValue(throwError(() => new Error('boom')));

    await clickDelete();

    expect(clearLocal).not.toHaveBeenCalled();
  });

  it('shows loading and locks the button while deleting', async () => {
    const pending = new Subject<void>();
    deleteAll.mockReturnValue(pending.asObservable() as Observable<void>);

    await clickDelete();

    expect(deleteButton().disabled).toBe(true);
    expect(host.querySelectorAll('mat-spinner').length).toBe(1);
    expect(logout).not.toHaveBeenCalled();
  });

  it('failure shows "Löschen nicht vollständig. Bitte erneut versuchen." and stays logged in', async () => {
    deleteAll.mockReturnValue(throwError(() => new Error('boom')));

    await clickDelete();

    expect(logout).not.toHaveBeenCalled();
    expect(openFromComponent).toHaveBeenCalledTimes(1);
    expect(openFromComponent.mock.calls[0][1].data).toBe(DELETE_ALL_FAILED);
    expect(DELETE_ALL_FAILED).toBe('Löschen nicht vollständig. Bitte erneut versuchen.');
    expect(deleteButton().disabled).toBe(false);
  });
});
