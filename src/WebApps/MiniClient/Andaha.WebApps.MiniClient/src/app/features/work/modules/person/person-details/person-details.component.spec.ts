import type { MockedObject } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { HistoryTrailService } from 'src/app/core/navigation/history-trail.service';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { PersonDto } from 'src/app/api/work/dtos/PersonDto';
import { PaymentDto } from 'src/app/api/work/dtos/PaymentDto';
import { PageTitleService } from 'src/app/core/page-title/page-title.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { ShowErrorPipe } from 'src/app/shared/form-field/show-error.pipe';
import { PersonContextService } from '../../../services/person-context.service';
import { WorkingEntriesContextService } from '../../../services/working-entries-context.service';
import { PersonPaymentDialogService } from '../person-payment-dialog/person-payment-dialog.service';
import { PersonDetailsComponent } from './person-details.component';

describe('PersonDetailsComponent', () => {
    let historyTrail: { leaveTo: ReturnType<typeof vi.fn> };
    let fixture: ComponentFixture<PersonDetailsComponent>;
    let persons$: BehaviorSubject<PersonDto[] | undefined>;
    let context: MockedObject<PersonContextService>;
    let router: { navigate: ReturnType<typeof vi.fn>; navigateByUrl: ReturnType<typeof vi.fn> };
    let confirmation: { openDialog: ReturnType<typeof vi.fn> };
    let paymentDialog: { openDialog: ReturnType<typeof vi.fn> };

    const payment: PaymentDto = {
        id: 'pay-1',
        payedAt: new Date(2026, 9, 12),
        payedHours: { hours: 20, minutes: 0 },
        payedMoney: 300,
        payedTip: 20
    };

    const person: PersonDto = {
        id: 'p-1',
        name: 'Alt',
        hourlyRate: 10,
        totalHours: { hours: 32, minutes: 30 },
        payedHours: { hours: 20, minutes: 0 },
        payments: [payment]
    };

    function host(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    function buttonWithText(text: string): HTMLButtonElement {
        const button = Array.from(host().querySelectorAll<HTMLButtonElement>('button'))
            .find(candidate => candidate.textContent?.trim().endsWith(text));
        if (!button) {
            throw new Error(`No button "${text}"`);
        }
        return button;
    }

    beforeEach(async () => {
        historyTrail = { leaveTo: vi.fn() };
        persons$ = new BehaviorSubject<PersonDto[] | undefined>([person]);
        router = { navigate: vi.fn().mockResolvedValue(true), navigateByUrl: vi.fn().mockResolvedValue(true) };
        confirmation = { openDialog: vi.fn() };
        paymentDialog = { openDialog: vi.fn().mockResolvedValue({ afterClosed: () => of(undefined) }) };
        context = {
            byId: vi.fn().mockName("PersonContextService.byId"),
            persons: vi.fn().mockName("PersonContextService.persons"),
            updatePerson: vi.fn().mockName("PersonContextService.updatePerson"),
            deletePayment: vi.fn().mockName("PersonContextService.deletePayment")
        } as unknown as MockedObject<PersonContextService>;
        context.byId.mockReturnValue(of(person));
        context.persons.mockReturnValue(persons$.asObservable());
        const entries = {
            workingEntries: vi.fn().mockName("WorkingEntriesContextService.workingEntries"),
            loading: vi.fn().mockName("WorkingEntriesContextService.loading"),
            error: signal(false),
            retry: vi.fn()
        };
        entries.workingEntries.mockReturnValue(new Subject<any>());
        entries.loading.mockReturnValue(new Subject<boolean>());

        await TestBed.configureTestingModule({
    imports: [ReactiveFormsModule, ShowErrorPipe, NoopAnimationsModule, PersonDetailsComponent],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [
        { provide: Router, useValue: router },
        { provide: HistoryTrailService, useValue: historyTrail },
        { provide: MatSnackBar, useValue: {
                openFromComponent: vi.fn().mockName("MatSnackBar.openFromComponent")
            } },
        { provide: PersonContextService, useValue: context },
        { provide: PageTitleService, useValue: {
                set: vi.fn().mockName("PageTitleService.set"),
                setAction: vi.fn().mockName("PageTitleService.setAction")
            } },
        { provide: ConfirmationDialogService, useValue: confirmation },
        { provide: PersonPaymentDialogService, useValue: paymentDialog },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'p-1' }, children: [], parent: null } } }
    ]
})
            .overrideComponent(PersonDetailsComponent, {
            set: { providers: [{ provide: WorkingEntriesContextService, useValue: entries }] }
        })
            .compileComponents();

        fixture = TestBed.createComponent(PersonDetailsComponent);
    });

    it('keeps entered values when a persons() refresh arrives while saving and the save fails', () => {
        fixture.detectChanges();
        const component = fixture.componentInstance;
        const save$ = new Subject<void>();
        context.updatePerson.mockReturnValue(save$.asObservable());

        component.onEditClick();
        component.form.controls.name.setValue('Neu');
        component.onSaveClick();

        persons$.next([{ ...person }]);
        save$.error(new Error('fail'));

        expect(component.isEditing).toBe(true);
        expect(component.form.enabled).toBe(true);
        expect(component.form.controls.name.value).toBe('Neu');
    });

    it('shows total, open hours and open amount', () => {
        fixture.detectChanges();

        const figures = Array.from(host().querySelectorAll('.figs > div'))
            .map(figure => `${figure.querySelector('span')!.textContent!.trim()} ${figure.querySelector('b')!.textContent!.trim()}`);
        expect(figures).toEqual(['Gesamt 32:30 h', 'Offen 12:30 h', 'Offen € 125,00 €']);
    });

    it('"Arbeitszeit erfassen" navigates with person preselected', () => {
        fixture.detectChanges();

        buttonWithText('Arbeitszeit erfassen').click();

        expect(router.navigate).toHaveBeenCalledWith(['/work/person/create-working-entry'], { queryParams: { person: 'p-1' } });
    });

    it('payment row has no double h', () => {
        fixture.detectChanges();

        const row = host().querySelector('.payment')!;
        expect(row.querySelector('.t')?.textContent?.trim()).toBe('12.10.2026 · 20:00 h');
        expect(row.querySelector('.s')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('300,00 € + 20,00 € Trinkgeld');
    });

    it('edit payment opens dialog with values', () => {
        fixture.detectChanges();

        host().querySelector<HTMLButtonElement>('.payment button[aria-label="Zahlung bearbeiten"]')!.click();

        expect(paymentDialog.openDialog).toHaveBeenCalledWith({
            personId: 'p-1',
            hourlyRate: 10,
            openHours: { hours: 12, minutes: 30 },
            payment
        });
    });

    it('"Zahlung" opens the dialog prefilled from the open hours and the hourly rate', () => {
        fixture.detectChanges();

        buttonWithText('Zahlung').click();

        expect(paymentDialog.openDialog).toHaveBeenCalledWith({
            personId: 'p-1',
            hourlyRate: 10,
            openHours: { hours: 12, minutes: 30 }
        });
    });

    it('delete payment asks confirmation', async () => {
        const vibrate = vi.spyOn(navigator, 'vibrate').mockImplementation(() => true);
        const confirmed$ = new Subject<boolean>();
        confirmation.openDialog.mockResolvedValue({ afterClosed: () => confirmed$.asObservable() });
        context.deletePayment.mockReturnValue(of(undefined));
        fixture.detectChanges();

        host().querySelector<HTMLButtonElement>('.payment button[aria-label="Zahlung löschen"]')!.click();
        await fixture.whenStable();

        expect(confirmation.openDialog).toHaveBeenCalledWith({ text: 'Soll diese Zahlung wirklich gelöscht werden?' });
        expect(context.deletePayment).not.toHaveBeenCalled();

        confirmed$.next(true);

        expect(context.deletePayment).toHaveBeenCalledWith('p-1', 'pay-1');
        expect(vibrate).toHaveBeenCalledWith(30);
        vibrate.mockRestore();
    });

    it('does not delete the payment when the confirmation is declined', async () => {
        confirmation.openDialog.mockResolvedValue({ afterClosed: () => of(false) });
        fixture.detectChanges();

        host().querySelector<HTMLButtonElement>('.payment button[aria-label="Zahlung löschen"]')!.click();
        await fixture.whenStable();

        expect(context.deletePayment).not.toHaveBeenCalled();
    });
});
