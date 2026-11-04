import type { MockedObject } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { HistoryTrailService } from 'src/app/core/navigation/history-trail.service';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { PersonDto } from 'src/app/api/work/dtos/PersonDto';
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

    const person: PersonDto = {
        id: 'p-1',
        name: 'Alt',
        hourlyRate: 10,
        totalHours: { hours: 0, minutes: 0 },
        payedHours: { hours: 0, minutes: 0 },
        payments: []
    };

    beforeEach(async () => {
        historyTrail = { leaveTo: vi.fn() };
        persons$ = new BehaviorSubject<PersonDto[] | undefined>([person]);
        context = {
            byId: vi.fn().mockName("PersonContextService.byId"),
            persons: vi.fn().mockName("PersonContextService.persons"),
            updatePerson: vi.fn().mockName("PersonContextService.updatePerson")
        } as unknown as MockedObject<PersonContextService>;
        context.byId.mockReturnValue(of(person));
        context.persons.mockReturnValue(persons$.asObservable());
        const entries = {
            workingEntries: vi.fn().mockName("WorkingEntriesContextService.workingEntries"),
            loading: vi.fn().mockName("WorkingEntriesContextService.loading")
        };
        entries.workingEntries.mockReturnValue(new Subject<any>());
        entries.loading.mockReturnValue(new Subject<boolean>());

        await TestBed.configureTestingModule({
    imports: [ReactiveFormsModule, ShowErrorPipe, NoopAnimationsModule, PersonDetailsComponent],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [
        { provide: Router, useValue: {
                navigateByUrl: vi.fn().mockName("Router.navigateByUrl")
            } },
        { provide: HistoryTrailService, useValue: historyTrail },
        { provide: MatSnackBar, useValue: {
                openFromComponent: vi.fn().mockName("MatSnackBar.openFromComponent")
            } },
        { provide: PersonContextService, useValue: context },
        { provide: PageTitleService, useValue: {
                set: vi.fn().mockName("PageTitleService.set"),
                setAction: vi.fn().mockName("PageTitleService.setAction")
            } },
        { provide: ConfirmationDialogService, useValue: {} },
        { provide: PersonPaymentDialogService, useValue: {} },
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
});
