import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, EventEmitter, Input, NO_ERRORS_SCHEMA, Output } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import moment from 'moment';
import { WorkingEntryDto } from 'src/app/api/work/dtos/WorkingEntryDto';
import { WorkingEntryApiService } from 'src/app/api/work/working-entry-api.service';
import { DatePickerFormFieldComponent } from 'src/app/shared/date-picker/date-picker-form-field/date-picker-form-field.component';
import { TimePickerFormFieldComponent } from 'src/app/shared/date-picker/time-picker-form-field/time-picker-form-field.component';
import { DialogComponent } from 'src/app/shared/dialog/dialog.component';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { WorkEntryDetailsDialogComponent } from './work-entry-details-dialog.component';

@Component({ selector: 'app-time-picker-form-field', template: '@if (error) {<span class="field-error">{{ error }}</span>}' })
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

@Component({ selector: 'app-dialog', template: '<ng-content />' })
class DialogStub {
    @Input() title = '';
}

describe('WorkEntryDetailsDialogComponent', () => {
    // 1. November 00:30 lokal: mit UTC-Getter oder +1 würde der Eintrag auf einen anderen Tag fallen
    const entry: WorkingEntryDto = {
        id: 'e-1', from: new Date(2026, 10, 1, 0, 30), until: new Date(2026, 10, 1, 8, 30), break: { hours: 0, minutes: 30 }
    };

    let fixture: ComponentFixture<WorkEntryDetailsDialogComponent>;
    let component: WorkEntryDetailsDialogComponent;
    let api: { updateWorkingEntry: ReturnType<typeof vi.fn> };

    beforeEach(async () => {
        api = { updateWorkingEntry: vi.fn().mockReturnValue(of(undefined)) };

        await TestBed.configureTestingModule({
            imports: [WorkEntryDetailsDialogComponent, NoopAnimationsModule],
            schemas: [NO_ERRORS_SCHEMA],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: { workEntry: entry } },
                { provide: MatDialogRef, useValue: { close: vi.fn() } },
                { provide: WorkingEntryApiService, useValue: api },
                { provide: ConfirmationDialogService, useValue: { openDialog: vi.fn() } },
                { provide: MatSnackBar, useValue: { openFromComponent: vi.fn() } }
            ]
        })
            .overrideComponent(WorkEntryDetailsDialogComponent, {
                remove: { imports: [DialogComponent, DatePickerFormFieldComponent, TimePickerFormFieldComponent] },
                add: { imports: [DialogStub, DatePickerStub, TimePickerStub] }
            })
            .compileComponents();

        fixture = TestBed.createComponent(WorkEntryDetailsDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('edit dialog reads and writes local date', () => {
        expect(component.getNgxTime(component.form.controls.fromTime)).toBe('00:30');

        component.onEditClick();
        // der Datepicker liefert ein Moment desselben lokalen Tages
        component.form.controls.date.setValue(moment(new Date(2026, 10, 2)) as unknown as Date);
        component.setFormTime(component.form.controls.fromTime, '01:15');
        component.onSaveClick();

        const dto = api.updateWorkingEntry.mock.calls[0][1];
        expect([dto.from.getMonth(), dto.from.getDate(), dto.from.getHours(), dto.from.getMinutes()]).toEqual([10, 2, 1, 15]);
        expect([dto.until.getMonth(), dto.until.getDate(), dto.until.getHours(), dto.until.getMinutes()]).toEqual([10, 2, 8, 30]);
    });

    it('shows "Ende liegt vor dem Beginn" and does not save', () => {
        component.onEditClick();
        component.setFormTime(component.form.controls.untilTime, '00:00');
        fixture.detectChanges();

        expect(component.untilError).toBe('Ende liegt vor dem Beginn');
        expect((fixture.nativeElement as HTMLElement).querySelector('.field-error')?.textContent).toContain('Ende liegt vor dem Beginn');
        expect(component.getWorkingTime()).toBe('–');

        component.onSaveClick();
        expect(api.updateWorkingEntry).not.toHaveBeenCalled();
    });

    it('flags a break that is not shorter than the working time at the Pause field', () => {
        component.onEditClick();
        component.setFormTime(component.form.controls.break, '08:00');

        expect(component.breakError).toBe('Pause ist länger als die Arbeitszeit');
    });
});
