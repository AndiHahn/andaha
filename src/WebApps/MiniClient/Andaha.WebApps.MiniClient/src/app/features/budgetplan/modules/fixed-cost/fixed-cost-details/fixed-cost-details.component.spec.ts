import type { MockedObject } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { HistoryTrailService } from 'src/app/core/navigation/history-trail.service';
import { Subject, of, throwError } from 'rxjs';
import { CostCategory } from 'src/app/api/budgetplan/dtos/CostCategory';
import { Duration } from 'src/app/api/budgetplan/dtos/Duration';
import { FixedCostDto } from 'src/app/api/budgetplan/dtos/FixedCostDto';
import { PageTitleService } from 'src/app/core/page-title/page-title.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { FixedCostContextService } from '../../../services/fixed-cost-context.service';
import { FixedCostHistoryDialogService } from '../fixed-cost-history-dialog/fixed-cost-history-dialog.service';
import { FixedCostDetailsComponent } from './fixed-cost-details.component';
import { ShowErrorPipe } from 'src/app/shared/form-field/show-error.pipe';

registerLocaleData(localeDe, 'de');

describe('FixedCostDetailsComponent', () => {
    let historyTrail: { leaveTo: ReturnType<typeof vi.fn> };
    let fixture: ComponentFixture<FixedCostDetailsComponent>;
    let byId$: Subject<FixedCostDto | undefined>;
    let router: MockedObject<Router>;
    let snackbar: MockedObject<MatSnackBar>;
    let context: MockedObject<FixedCostContextService>;
    let confirmation: { openDialog: ReturnType<typeof vi.fn> };

    const fixedCost: FixedCostDto = {
        id: 'fc-1',
        name: 'Miete Testwohnung',
        value: 750,
        duration: Duration.Monthly,
        category: Object.values(CostCategory)[0]
    };

    beforeEach(async () => {
        historyTrail = { leaveTo: vi.fn() };
        byId$ = new Subject<FixedCostDto | undefined>();
        router = {
            navigateByUrl: vi.fn().mockName("Router.navigateByUrl")
        } as unknown as MockedObject<Router>;
        snackbar = {
            openFromComponent: vi.fn().mockName("MatSnackBar.openFromComponent")
        } as unknown as MockedObject<MatSnackBar>;
        context = {
            byId: vi.fn().mockName("FixedCostContextService.byId"),
            updateFixedCost: vi.fn().mockName("FixedCostContextService.updateFixedCost"),
            deleteFixedCost: vi.fn().mockName("FixedCostContextService.deleteFixedCost")
        } as unknown as MockedObject<FixedCostContextService>;
        confirmation = { openDialog: vi.fn(() => Promise.resolve({ afterClosed: () => of(true) })) };
        context.byId.mockReturnValue(byId$.asObservable());
        const pageTitle = {
            set: vi.fn().mockName("PageTitleService.set"),
            setAction: vi.fn().mockName("PageTitleService.setAction")
        };

        await TestBed.configureTestingModule({
    imports: [ReactiveFormsModule, ShowErrorPipe, MatSelectModule, NoopAnimationsModule, FixedCostDetailsComponent],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [
        { provide: Router, useValue: router },
        { provide: HistoryTrailService, useValue: historyTrail },
        { provide: MatSnackBar, useValue: snackbar },
        { provide: FixedCostContextService, useValue: context },
        { provide: PageTitleService, useValue: pageTitle },
        { provide: ConfirmationDialogService, useValue: confirmation },
        { provide: FixedCostHistoryDialogService, useValue: {} },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'fc-1' }, children: [], parent: null } } }
    ]
}).compileComponents();

        fixture = TestBed.createComponent(FixedCostDetailsComponent);
    });

    it('shows progress until data arrives', () => {
        fixture.detectChanges();
        const el: HTMLElement = fixture.nativeElement;
        expect(el.querySelector('.progress-slot mat-progress-bar')).toBeTruthy();
        expect(el.querySelector('form')).toBeNull();
    });

    it('renders entry after load', () => {
        fixture.detectChanges();
        byId$.next(fixedCost);
        byId$.complete();
        fixture.detectChanges();
        const el: HTMLElement = fixture.nativeElement;
        expect(el.querySelector('form')).toBeTruthy();
        expect((el.querySelector('input[formControlName="name"]') as HTMLInputElement).value).toBe('Miete Testwohnung');
        expect(el.querySelector('.progress-slot mat-progress-bar')).toBeNull();
    });

    it('navigates to list when entry not found', () => {
        fixture.detectChanges();
        byId$.next(undefined);
        byId$.complete();
        expect(historyTrail.leaveTo).toHaveBeenCalledWith('/budgetplan/fixedcost');
        expect(snackbar.openFromComponent).toHaveBeenCalled();
    });

    it('does not throw without loaded data', () => {
        expect(() => {
            fixture.detectChanges();
        }).not.toThrow();
    });

    function load(): FixedCostDetailsComponent {
        fixture.detectChanges();
        byId$.next(fixedCost);
        byId$.complete();
        fixture.detectChanges();
        return fixture.componentInstance;
    }

    it('keeps form editable with entered values after save error', () => {
        const component = load();
        context.updateFixedCost.mockReturnValue(throwError(() => new Error('fail')));

        component.onEditClick();
        component.form.controls.name.setValue('Neu');
        component.onSaveClick();

        expect(component.form.enabled).toBe(true);
        expect(component.isEditing).toBe(true);
        expect(component.isSaving).toBe(false);
        expect(component.form.controls.name.value).toBe('Neu');
        expect(snackbar.openFromComponent).toHaveBeenCalled();
    });

    it('cancel after successful save restores saved values', () => {
        const component = load();
        context.updateFixedCost.mockReturnValue(of(undefined));

        component.onEditClick();
        component.form.controls.name.setValue('Neu');
        component.onSaveClick();
        component.onEditClick();
        component.form.controls.name.setValue('Anders');
        component.onCancelClick();

        expect(component.form.controls.name.value).toBe('Neu');
        expect(component.isEditing).toBe(false);
    });

    it('delete: vibrates and leaves to the list after success (AC35)', async () => {
        const component = load();
        context.deleteFixedCost.mockReturnValue(of(undefined));
        const vibrate = vi.spyOn(navigator, 'vibrate').mockImplementation(() => true);

        component.onDeleteClick();
        await fixture.whenStable();

        expect(context.deleteFixedCost).toHaveBeenCalledWith('fc-1');
        expect(vibrate).toHaveBeenCalledWith(30);
        expect(historyTrail.leaveTo).toHaveBeenCalledWith('/budgetplan/fixedcost');
        vibrate.mockRestore();
    });

    it('delete failed: error snackbar, no vibration', async () => {
        const component = load();
        context.deleteFixedCost.mockReturnValue(throwError(() => new Error('fail')));
        const vibrate = vi.spyOn(navigator, 'vibrate').mockImplementation(() => true);

        component.onDeleteClick();
        await fixture.whenStable();

        expect(snackbar.openFromComponent).toHaveBeenCalled();
        expect(vibrate).not.toHaveBeenCalled();
        expect(historyTrail.leaveTo).not.toHaveBeenCalled();
        vibrate.mockRestore();
    });
});
