import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { ExpenseContextService } from '../bill/services/expense-context.service';
import { PersonContextService } from '../work/services/person-context.service';
import { ExportComponent } from './export.component';

describe('ExportComponent', () => {
  let fixture: ComponentFixture<ExportComponent>;
  let expensesExport: Subject<void>;
  let workExport: Subject<void>;

  beforeEach(async () => {
    expensesExport = new Subject<void>();
    workExport = new Subject<void>();

    await TestBed.configureTestingModule({
    imports: [MatProgressSpinnerModule, ExportComponent],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [
        { provide: ExpenseContextService, useValue: { downloadExpenses: () => expensesExport.asObservable() } },
        { provide: PersonContextService, useValue: { downloadPersonInformations: () => workExport.asObservable() } }
    ]
}).compileComponents();

    fixture = TestBed.createComponent(ExportComponent);
    fixture.detectChanges();
  });

  function buttons(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('button.ex'));
  }

  function spinnersIn(button: HTMLButtonElement): number {
    return button.querySelectorAll('mat-spinner').length;
  }

  function click(index: number): void {
    buttons()[index].click();
    fixture.detectChanges();
  }

  it('shows the spinner only in the expenses row', () => {
    click(0);

    expect(spinnersIn(buttons()[0])).toBe(1);
    expect(spinnersIn(buttons()[1])).toBe(0);
    expect(document.querySelectorAll('mat-spinner').length).toBe(1);
  });

  it('shows the spinner only in the work row', () => {
    click(1);

    expect(spinnersIn(buttons()[0])).toBe(0);
    expect(spinnersIn(buttons()[1])).toBe(1);
    expect(document.querySelectorAll('mat-spinner').length).toBe(1);
  });

  it('disables both buttons while an export runs', () => {
    click(0);

    expect(buttons()[0].disabled).toBe(true);
    expect(buttons()[1].disabled).toBe(true);
  });

  it('resets after success', () => {
    click(0);

    expensesExport.next();
    fixture.detectChanges();

    expect(document.querySelectorAll('mat-spinner').length).toBe(0);
    expect(buttons()[0].disabled).toBe(false);
    expect(buttons()[1].disabled).toBe(false);
  });

  it('resets when the export completes without a value', () => {
    click(1);

    workExport.complete();
    fixture.detectChanges();

    expect(document.querySelectorAll('mat-spinner').length).toBe(0);
    expect(buttons()[0].disabled).toBe(false);
    expect(buttons()[1].disabled).toBe(false);
  });

  it('resets after error', () => {
    click(1);

    workExport.error(new Error('export failed'));
    fixture.detectChanges();

    expect(document.querySelectorAll('mat-spinner').length).toBe(0);
    expect(buttons()[0].disabled).toBe(false);
    expect(buttons()[1].disabled).toBe(false);
  });
});
