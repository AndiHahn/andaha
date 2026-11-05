import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { BillDto } from 'src/app/api/shopping/dtos/BillDto';
import { HistoryTrailService } from 'src/app/core/navigation/history-trail.service';
import { BillContextService } from 'src/app/features/bill/services/bill-context.service';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { BillDetailsComponent } from './bill-details.component';

describe('BillDetailsComponent', () => {
  let fixture: ComponentFixture<BillDetailsComponent>;
  let host: HTMLElement;
  let navigate: ReturnType<typeof vi.spyOn>;
  let deleteBill: ReturnType<typeof vi.fn>;
  let leaveTo: ReturnType<typeof vi.fn>;
  let openConfirmation: ReturnType<typeof vi.fn>;

  const bill: BillDto = {
    id: 'b1',
    category: { id: 'c1', name: 'Lebensmittel', color: '#3B7D4F', order: 0 },
    subCategory: { id: 's1', name: 'Gebäck', order: 0 },
    shopName: 'Bäckerei Ströck',
    price: 6.4,
    notes: 'Frühstück',
    date: new Date(2026, 9, 3),
    isExternal: false,
    fromAnalysis: false,
    imageAvailable: true
  };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 5, 9, 0));

    deleteBill = vi.fn(() => of(undefined));
    leaveTo = vi.fn();
    openConfirmation = vi.fn(() => Promise.resolve({ afterClosed: () => of(true) }));

    TestBed.configureTestingModule({
      imports: [BillDetailsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'b1' }, children: [], parent: null } } },
        { provide: HistoryTrailService, useValue: { leaveTo } },
        { provide: ConfirmationDialogService, useValue: { openDialog: openConfirmation } },
        {
          provide: BillContextService,
          useValue: { loadBillById: () => of({ ...bill }), loading: () => of(false), deleteBill }
        },
        { provide: BillCategoryContextService, useValue: { categories: () => of([]) } }
      ]
    });
    vi.spyOn(TestBed.inject(MatSnackBar), 'openFromComponent').mockReturnValue(undefined as never);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(BillDetailsComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const button = (text: string) =>
    Array.from(host.querySelectorAll<HTMLButtonElement>('.actions button')).find(b => b.textContent?.includes(text))!;

  it('duplicate navigates to /bill/create with prefill', () => {
    button('Duplizieren').click();

    expect(navigate).toHaveBeenCalledWith(['/bill/create'], {
      state: {
        prefill: {
          price: 6.4,
          shopName: 'Bäckerei Ströck',
          categoryId: 'c1',
          subCategoryId: 's1',
          notes: 'Frühstück',
          date: '2026-11-05'
        }
      }
    });
  });

  it('external bill: "Löschen" is disabled', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [BillDetailsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'b1' }, children: [], parent: null } } },
        { provide: HistoryTrailService, useValue: { leaveTo } },
        { provide: ConfirmationDialogService, useValue: { openDialog: openConfirmation } },
        {
          provide: BillContextService,
          useValue: { loadBillById: () => of({ ...bill, isExternal: true }), loading: () => of(false), deleteBill }
        },
        { provide: BillCategoryContextService, useValue: { categories: () => of([]) } }
      ]
    });
    fixture = TestBed.createComponent(BillDetailsComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();

    expect(button('Löschen').disabled).toBe(true);
    expect(button('Duplizieren').disabled).toBe(false);
  });

  it('delete asks confirmation, deletes and vibrates', async () => {
    const vibrate = vi.spyOn(navigator, 'vibrate').mockImplementation(() => true);

    button('Löschen').click();
    await vi.waitFor(() => expect(deleteBill).toHaveBeenCalledWith('b1'));

    expect(openConfirmation).toHaveBeenCalledTimes(1);
    expect(vibrate).toHaveBeenCalledWith(30);
    expect(leaveTo).toHaveBeenCalledWith('/bill/list');
    vibrate.mockRestore();
  });
});
