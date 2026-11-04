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

  beforeEach(() => {
    desktop = false;
    sheetClosed = new Subject<void>();
    dialogClosed = new Subject<void>();
    sheet = { open: vi.fn(() => ({ afterDismissed: () => sheetClosed })) };
    dialog = { open: vi.fn(() => ({ afterClosed: () => dialogClosed })) };
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
});
