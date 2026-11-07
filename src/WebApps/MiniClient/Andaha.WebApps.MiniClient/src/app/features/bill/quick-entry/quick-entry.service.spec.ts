import { TestBed } from '@angular/core/testing';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { SheetService } from 'src/app/core/overlay/sheet.service';
import { QuickEntrySheetComponent } from './quick-entry-sheet/quick-entry-sheet.component';
import { QuickEntryService } from './quick-entry.service';

describe('QuickEntryService', () => {
  let desktop: boolean;
  let sheetClosed: Subject<void>;
  let dialogClosed: Subject<void>;
  let sheet: { open: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let sheetRef: { afterDismissed: () => Subject<void>; dismiss: ReturnType<typeof vi.fn> };
  let dialogRef: { afterClosed: () => Subject<void>; close: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    desktop = false;
    sheetClosed = new Subject<void>();
    dialogClosed = new Subject<void>();
    sheetRef = { afterDismissed: () => sheetClosed, dismiss: vi.fn(() => sheetClosed.next()) };
    dialogRef = { afterClosed: () => dialogClosed, close: vi.fn(() => dialogClosed.next()) };
    sheet = { open: vi.fn(() => sheetRef) };
    dialog = { open: vi.fn(() => dialogRef) };
    TestBed.configureTestingModule({
      providers: [
        { provide: SheetService, useValue: sheet },
        { provide: MatDialog, useValue: dialog },
        { provide: BreakpointObserver, useValue: { isMatched: () => desktop } }
      ]
    });
  });

  it('opens the bottom sheet below 1024 px', () => {
    TestBed.inject(QuickEntryService).open();
    expect(sheet.open).toHaveBeenCalledWith(QuickEntrySheetComponent, expect.objectContaining({ ariaLabel: 'Neue Rechnung' }));
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('opens a 480 px dialog from 1024 px on', () => {
    desktop = true;
    TestBed.inject(QuickEntryService).open();
    expect(dialog.open).toHaveBeenCalledWith(QuickEntrySheetComponent, expect.objectContaining({ width: '480px', ariaLabel: 'Neue Rechnung' }));
    expect(sheet.open).not.toHaveBeenCalled();
  });

  it('opens only one at a time', () => {
    const service = TestBed.inject(QuickEntryService);
    service.open();
    service.open();
    expect(sheet.open).toHaveBeenCalledTimes(1);
    sheetClosed.next();
    service.open();
    expect(sheet.open).toHaveBeenCalledTimes(2);
  });

  it('open returns a handle whose close() dismisses the sheet', () => {
    const handle = TestBed.inject(QuickEntryService).open();
    handle!.close();
    expect(sheetRef.dismiss).toHaveBeenCalled();
  });

  it('close() dismisses the desktop dialog', () => {
    desktop = true;
    TestBed.inject(QuickEntryService).open()!.close();
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('open returns null while one is open', () => {
    const service = TestBed.inject(QuickEntryService);
    expect(service.open()).not.toBeNull();
    expect(service.open()).toBeNull();
  });

  it('closed$ emits once when the sheet is dismissed externally', () => {
    const handle = TestBed.inject(QuickEntryService).open()!;
    const emitted = vi.fn();
    const completed = vi.fn();
    handle.closed$.subscribe({ next: emitted, complete: completed });
    sheetClosed.next();
    sheetClosed.next();
    expect(emitted).toHaveBeenCalledTimes(1);
    expect(completed).toHaveBeenCalled();
  });

  it('preview passes { preview: true } as data and disables autoFocus on desktop', () => {
    TestBed.inject(QuickEntryService).open({ preview: true });
    expect(sheet.open).toHaveBeenCalledWith(QuickEntrySheetComponent, expect.objectContaining({ data: { preview: true } }));
    sheetClosed.next();

    desktop = true;
    TestBed.inject(QuickEntryService).open({ preview: true });
    expect(dialog.open).toHaveBeenCalledWith(QuickEntrySheetComponent,
      expect.objectContaining({ data: { preview: true }, autoFocus: false }));
  });

  it('a normal open keeps the amount autofocus on desktop', () => {
    desktop = true;
    TestBed.inject(QuickEntryService).open();
    expect(dialog.open).toHaveBeenCalledWith(QuickEntrySheetComponent,
      expect.objectContaining({ autoFocus: 'input[name="amount"]' }));
  });
});
