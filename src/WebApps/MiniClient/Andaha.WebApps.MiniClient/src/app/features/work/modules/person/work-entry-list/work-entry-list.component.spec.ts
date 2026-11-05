import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { WorkingEntryDto } from 'src/app/api/work/dtos/WorkingEntryDto';
import { PersonContextService } from '../../../services/person-context.service';
import { WorkingEntriesContextService } from '../../../services/working-entries-context.service';
import { WorkEntryDetailsDialogService } from '../work-entry-details/work-entry-details-dialog.service';
import { WorkEntryListComponent } from './work-entry-list.component';

describe('WorkEntryListComponent', () => {
  let fixture: ComponentFixture<WorkEntryListComponent>;
  let entriesContext: {
    hasOlder: WritableSignal<boolean>;
    loadingOlder: WritableSignal<boolean>;
    loadOlder: ReturnType<typeof vi.fn>;
    refetch: ReturnType<typeof vi.fn>;
  };
  let personContext: { refetch: ReturnType<typeof vi.fn> };
  let dialog: { openDialog: ReturnType<typeof vi.fn> };

  function entry(id: string, day: Date, from: [number, number], until: [number, number], breakTime: [number, number], notes?: string): WorkingEntryDto {
    return {
      id,
      from: new Date(day.getFullYear(), day.getMonth(), day.getDate(), from[0], from[1]),
      until: new Date(day.getFullYear(), day.getMonth(), day.getDate(), until[0], until[1]),
      break: { hours: breakTime[0], minutes: breakTime[1] },
      notes
    };
  }

  const entries: WorkingEntryDto[] = [
    entry('a', new Date(2026, 10, 4), [7, 0], [12, 30], [0, 30], 'Garten'),
    entry('b', new Date(2026, 10, 2), [8, 0], [12, 0], [0, 30]),
    entry('c', new Date(2026, 9, 28), [7, 0], [15, 0], [1, 0])
  ];

  function render(workEntries: WorkingEntryDto[] = entries, hourlyRate = 15): HTMLElement {
    fixture.componentRef.setInput('workEntries', workEntries);
    fixture.componentRef.setInput('hourlyRate', hourlyRate);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function texts(host: HTMLElement, selector: string): string[] {
    return Array.from(host.querySelectorAll(selector)).map(element => element.textContent!.replace(/\s+/g, ' ').trim());
  }

  beforeEach(async () => {
    entriesContext = {
      hasOlder: signal(false),
      loadingOlder: signal(false),
      loadOlder: vi.fn(),
      refetch: vi.fn()
    };
    personContext = { refetch: vi.fn() };
    dialog = { openDialog: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [WorkEntryListComponent],
      providers: [
        { provide: WorkingEntriesContextService, useValue: entriesContext },
        { provide: PersonContextService, useValue: personContext },
        { provide: WorkEntryDetailsDialogService, useValue: dialog }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkEntryListComponent);
  });

  it('groups by month with hours and euro subtotal', () => {
    const host = render();

    expect(texts(host, '.month-head b')).toEqual(['November 2026', 'Oktober 2026']);
    expect(texts(host, '.month-head span')).toEqual(['8:30 h · 127,50 €', '7:00 h · 105,00 €']);
    expect(texts(host, '.row .amt')).toEqual(['5:00 h', '3:30 h', '7:00 h']);
  });

  it('renders a row with day, weekday, times, break, notes and net hours', () => {
    const host = render();

    const first = host.querySelector('.row')!;
    expect(first.querySelector('.date b')?.textContent?.trim()).toBe('04');
    // Wochentag wie in der Rechnungsliste (Angular 'EEEEEE', de: „Mi.“)
    expect(first.querySelector('.date span')?.textContent?.trim()).toBe('Mi.');
    expect(first.querySelector('.t')?.textContent?.trim()).toBe('07:00 – 12:30');
    expect(first.querySelector('.s')?.textContent?.trim()).toBe('Pause 0:30 · Garten');
    expect(first.querySelector('.amt')?.textContent?.trim()).toBe('5:00 h');
  });

  it('"Ältere Monate laden" appends next months', () => {
    let host = render();
    expect(host.querySelector('.more')).toBeNull();

    entriesContext.hasOlder.set(true);
    host = render();
    const button = host.querySelector<HTMLButtonElement>('.more button')!;
    expect(button.textContent?.trim()).toBe('Ältere Monate laden');

    button.click();

    expect(entriesContext.loadOlder).toHaveBeenCalledTimes(1);
  });

  it('after edit/delete entry person totals refresh', async () => {
    dialog.openDialog.mockResolvedValue({ afterClosed: () => of(true) });
    const host = render();

    host.querySelector<HTMLButtonElement>('.row')!.click();
    await fixture.whenStable();

    expect(dialog.openDialog).toHaveBeenCalledWith({ workEntry: entries[0] });
    expect(entriesContext.refetch).toHaveBeenCalledTimes(1);
    expect(personContext.refetch).toHaveBeenCalledTimes(1);
  });

  it('does not refresh when the dialog was closed without changes', async () => {
    dialog.openDialog.mockResolvedValue({ afterClosed: () => of(undefined) });
    const host = render();

    host.querySelector<HTMLButtonElement>('.row')!.click();
    await fixture.whenStable();

    expect(entriesContext.refetch).not.toHaveBeenCalled();
    expect(personContext.refetch).not.toHaveBeenCalled();
  });
});
