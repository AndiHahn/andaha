import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Input, NO_ERRORS_SCHEMA, Output, EventEmitter } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PersonDto } from 'src/app/api/work/dtos/PersonDto';
import { WorkingEntryDto } from 'src/app/api/work/dtos/WorkingEntryDto';
import { WorkingEntryApiService } from 'src/app/api/work/working-entry-api.service';
import { DatePickerFormFieldComponent } from 'src/app/shared/date-picker/date-picker-form-field/date-picker-form-field.component';
import { TimePickerFormFieldComponent } from 'src/app/shared/date-picker/time-picker-form-field/time-picker-form-field.component';
import { PanelBackDirective } from 'src/app/core/overlay/panel-back.directive';
import { PersonContextService } from '../../../services/person-context.service';
import { StatisticsContextService } from '../../../services/statistics-context.service';
import { WorkingEntriesContextGlobalService } from '../../../services/working-entries-context-global.service';
import { PageTitleService } from 'src/app/core/page-title/page-title.service';
import { HistoryTrailService } from 'src/app/core/navigation/history-trail.service';
import { AddWorkingEntryComponent } from './add-working-entry.component';

// Die Picker bringen Overlay und Locale-Dienste mit; die Seite prüft nur, was sie ihnen übergibt.
@Component({ selector: 'app-time-picker-form-field', template: '<span class="label">{{ label }}</span>@if (error) {<span class="field-error">{{ error }}</span>}' })
class TimePickerStub {
    @Input() label = '';
    @Input() defaultTime = '';
    @Input() error: string | null = null;
    @Input() disabled = false;
    @Output() timeChanged = new EventEmitter<string>();
}

@Component({ selector: 'app-date-picker-form-field', template: '' })
class DatePickerStub {
    @Input() control: unknown;
    @Input() label = '';
}

describe('AddWorkingEntryComponent', () => {
    const maria: PersonDto = { id: 'p-1', name: 'Maria', hourlyRate: 10, totalHours: { hours: 0, minutes: 0 }, payedHours: { hours: 0, minutes: 0 }, payments: [] };
    const stefan: PersonDto = { ...maria, id: 'p-2', name: 'Stefan' };
    const lastEntry: WorkingEntryDto = {
        id: 'e-1', from: new Date(2026, 10, 4, 7, 0), until: new Date(2026, 10, 4, 12, 30), break: { hours: 0, minutes: 30 }, notes: 'Garten'
    };

    let fixture: ComponentFixture<AddWorkingEntryComponent>;
    let component: AddWorkingEntryComponent;
    let api: { listWorkingEntryMonths: ReturnType<typeof vi.fn> };
    let create: { createEntries: ReturnType<typeof vi.fn> };
    let statistics: { refreshTimeRange: ReturnType<typeof vi.fn> };
    let snackbar: { openFromComponent: ReturnType<typeof vi.fn> };
    let pageTitle: { setBack: ReturnType<typeof vi.fn> };
    let historyTrail: { leaveTo: ReturnType<typeof vi.fn> };

    function host(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    function lastEntryRow(): HTMLElement | null {
        return host().querySelector('.restored');
    }

    function saveButton(): HTMLButtonElement {
        return host().querySelector<HTMLButtonElement>('button[type=submit]')!;
    }

    async function setup(queryPerson: string | null): Promise<void> {
        api = { listWorkingEntryMonths: vi.fn().mockReturnValue(of({ entries: [lastEntry], nextUntil: null })) };
        create = { createEntries: vi.fn().mockReturnValue(of(undefined)) };
        statistics = { refreshTimeRange: vi.fn() };
        snackbar = { openFromComponent: vi.fn() };
        pageTitle = { setBack: vi.fn() };
        historyTrail = { leaveTo: vi.fn() };

        await TestBed.configureTestingModule({
            imports: [AddWorkingEntryComponent, NoopAnimationsModule],
            schemas: [NO_ERRORS_SCHEMA],
            providers: [
                { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(queryPerson ? { person: queryPerson } : {}) } } },
                { provide: PersonContextService, useValue: { persons: () => of([maria, stefan]), refetch: vi.fn() } },
                { provide: WorkingEntryApiService, useValue: api },
                { provide: WorkingEntriesContextGlobalService, useValue: create },
                { provide: StatisticsContextService, useValue: statistics },
                { provide: MatSnackBar, useValue: snackbar },
                { provide: PageTitleService, useValue: pageTitle },
                { provide: HistoryTrailService, useValue: historyTrail }
            ]
        })
            .overrideComponent(AddWorkingEntryComponent, {
                remove: { imports: [DatePickerFormFieldComponent, TimePickerFormFieldComponent, PanelBackDirective] },
                add: { imports: [DatePickerStub, TimePickerStub] }
            })
            .compileComponents();

        fixture = TestBed.createComponent(AddWorkingEntryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }

    it('preselects person from query', async () => {
        await setup('p-2');

        expect(component.form.controls.selectedPersons.value).toEqual([stefan]);
        expect(api.listWorkingEntryMonths).toHaveBeenCalledWith('p-2', undefined, 1);
    });

    it('leaves the selection empty without a matching query person', async () => {
        await setup('unknown');

        expect(component.form.controls.selectedPersons.value).toEqual([]);
        expect(lastEntryRow()).toBeNull();
    });

    it('"Übernehmen" copies times, break, notes and keeps today', async () => {
        await setup('p-1');
        const today = component.form.controls.date.value;
        fixture.detectChanges();

        expect(lastEntryRow()?.textContent).toContain('Letzter Eintrag: 04.11. · 07:00 – 12:30');
        lastEntryRow()!.querySelector<HTMLButtonElement>('button')!.click();
        fixture.detectChanges();

        const controls = component.form.controls;
        expect([controls.fromTime.value.getHours(), controls.fromTime.value.getMinutes()]).toEqual([7, 0]);
        expect([controls.untilTime.value.getHours(), controls.untilTime.value.getMinutes()]).toEqual([12, 30]);
        expect(controls.break.value).toEqual({ hours: 0, minutes: 30 });
        expect(controls.notes.value).toBe('Garten');
        expect(controls.date.value).toBe(today);
    });

    it('row hidden when several persons selected', async () => {
        await setup('p-1');
        fixture.detectChanges();
        expect(lastEntryRow()).not.toBeNull();

        component.form.controls.selectedPersons.setValue([maria, stefan]);
        fixture.detectChanges();

        expect(lastEntryRow()).toBeNull();
    });

    it('shows "Ende liegt vor dem Beginn" and disables save', async () => {
        await setup('p-1');
        expect(saveButton().disabled).toBe(false);

        component.setFormTime(component.form.controls.untilTime, '06:00');
        fixture.detectChanges();

        expect(host().querySelector('.field-error')?.textContent).toContain('Ende liegt vor dem Beginn');
        expect(saveButton().disabled).toBe(true);
        expect(host().querySelector('.net-v')?.textContent?.trim()).toBe('–');
    });

    it('flags a break as long as the working time at the Pause field', async () => {
        await setup('p-1');

        component.setFormTime(component.form.controls.break, '10:00');
        fixture.detectChanges();

        expect(component.breakError).toBe('Pause ist länger als die Arbeitszeit');
        expect(component.untilError).toBeNull();
        expect(saveButton().disabled).toBe(true);
    });

    it('sends the chosen local day with the local times', async () => {
        await setup('p-1');
        component.form.controls.date.setValue(new Date(2026, 10, 1));
        component.setFormTime(component.form.controls.fromTime, '00:30');
        component.setFormTime(component.form.controls.untilTime, '08:30');

        component.onSubmit();

        const dto = create.createEntries.mock.calls[0][0];
        expect([dto.from.getMonth(), dto.from.getDate(), dto.from.getHours(), dto.from.getMinutes()]).toEqual([10, 1, 0, 30]);
        expect([dto.until.getMonth(), dto.until.getDate(), dto.until.getHours()]).toEqual([10, 1, 8]);
    });

    it('save error says "Arbeitszeit konnte nicht gespeichert werden."', async () => {
        await setup('p-1');
        create.createEntries.mockReturnValue(throwError(() => new Error('400')));

        component.onSubmit();

        expect(snackbar.openFromComponent.mock.calls[0][1].data).toBe('Arbeitszeit konnte nicht gespeichert werden.');
        expect(statistics.refreshTimeRange).not.toHaveBeenCalled();
    });

    it('opened with ?person= the back arrow and the save lead to that person page', async () => {
        await setup('p-2');
        expect(pageTitle.setBack).toHaveBeenCalledWith('/work/person/p-2');

        component.onSubmit();

        expect(historyTrail.leaveTo).toHaveBeenCalledWith('/work/person/p-2');
    });

    it('opened without ?person= keeps the persons list as back target and stays after save', async () => {
        await setup(null);
        component.form.controls.selectedPersons.setValue([maria]);

        component.onSubmit();

        expect(pageTitle.setBack).not.toHaveBeenCalled();
        expect(historyTrail.leaveTo).not.toHaveBeenCalled();
    });

    it('after save the statistics time range refreshes', async () => {
        await setup('p-1');

        component.onSubmit();

        expect(statistics.refreshTimeRange).toHaveBeenCalledTimes(1);
    });
});
