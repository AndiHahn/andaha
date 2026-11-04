import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { BillAnalyzedDto } from 'src/app/api/shopping/dtos/BillAnalyzedDto';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { BillImageDialogService } from 'src/app/features/bill/modules/bill-image-dialog/bill-image-dialog.service';
import { BillCreatePrefill } from 'src/app/features/bill/models/bill-create-prefill';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { AnalyzedBillContextService } from '../../services/analyzed-bill-context.service';
import { AnalyzedBillDetailsComponent } from './analyzed-bill-details.component';

const categories: CategoryDto[] = [
  {
    id: 'c1', name: 'Lebensmittel', color: '#7FB89A', order: 0, includeToStatistics: true, isDefault: false,
    subCategories: [{ id: 's1', name: 'Gebäck', order: 0 }]
  }
];

const bill: BillAnalyzedDto = {
  id: 'a1',
  shopName: 'Billa',
  price: 12.5,
  date: new Date(2026, 10, 3),
  categoryId: 'c1',
  subCategoryId: 's1',
  confidence: 0.8,
  imageAvailable: true,
  lineItems: [
    { description: 'Semmel', quantity: 4, unitPrice: 0.5, totalPrice: 2 },
    { description: 'Milch', quantity: 1, unitPrice: 1.5, totalPrice: 1.5 }
  ]
};

interface SetupOptions {
  bill?: BillAnalyzedDto;
  confirmed?: boolean;
  deleteAnalyzedBill?: () => Observable<void>;
  downloadImage?: () => Observable<Blob>;
}

describe('AnalyzedBillDetailsComponent', () => {
  let fixture: ComponentFixture<AnalyzedBillDetailsComponent>;
  let host: HTMLElement;
  let deleteAnalyzedBill: ReturnType<typeof vi.fn>;
  let downloadImage: ReturnType<typeof vi.fn>;
  let remove: ReturnType<typeof vi.fn>;
  let openConfirmation: ReturnType<typeof vi.fn>;
  let openImageDialog: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.spyOn>;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;
  let openSnackbar: ReturnType<typeof vi.spyOn>;

  async function setup(options: SetupOptions = {}): Promise<void> {
    const shown = options.bill ?? bill;
    deleteAnalyzedBill = vi.fn(options.deleteAnalyzedBill ?? (() => of(undefined)));
    downloadImage = vi.fn(options.downloadImage ?? (() => of(new Blob(['jpg'], { type: 'image/jpeg' }))));
    remove = vi.fn();
    openConfirmation = vi.fn(() => Promise.resolve({ afterClosed: () => of(options.confirmed ?? true) }));
    openImageDialog = vi.fn(() => Promise.resolve({ afterClosed: () => of(undefined) }));

    TestBed.configureTestingModule({
      imports: [AnalyzedBillDetailsComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: shown.id }, children: [], parent: null } } },
        { provide: AnalyzedBillContextService, useValue: { byId: () => of(shown), remove } },
        { provide: BillCategoryContextService, useValue: { categories: () => of(categories) } },
        { provide: BillApiService, useValue: { deleteAnalyzedBill, downloadAnalyzedBillImage: downloadImage } },
        { provide: ConfirmationDialogService, useValue: { openDialog: openConfirmation } },
        { provide: BillImageDialogService, useValue: { openDialog: openImageDialog } }
      ]
    });

    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    openSnackbar = vi.spyOn(TestBed.inject(MatSnackBar), 'openFromComponent').mockReturnValue(undefined as never);

    fixture = TestBed.createComponent(AnalyzedBillDetailsComponent);
    host = fixture.nativeElement;
    await settle();
  }

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function button(text: string): HTMLButtonElement {
    const found = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(b => b.textContent?.includes(text));
    expect(found, `Button „${text}“`).toBeTruthy();
    return found!;
  }

  it('zeigt die Positionen (AC32)', async () => {
    await setup();

    const rows = Array.from(host.querySelectorAll('.line-item'));
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Semmel');
    expect(rows[0].textContent).toContain('4 × 0,50');
    expect(rows[0].textContent).toContain('2,00');
    expect(rows[1].textContent).toContain('Milch');
  });

  it('ohne Positionen: kein Positionen-Abschnitt', async () => {
    await setup({ bill: { ...bill, lineItems: [] } });

    expect(host.querySelector('.line-item')).toBeNull();
    expect(host.textContent).not.toContain('Positionen');
  });

  it('öffnet das Foto im Pinch-Zoom-Dialog der Rechnungen (AC34)', async () => {
    await setup();

    host.querySelector<HTMLButtonElement>('.receipt-btn')!.click();
    await settle();

    expect(openImageDialog).toHaveBeenCalledTimes(1);
    const data = openImageDialog.mock.calls[0][0] as { image: Observable<Blob>; delete?: unknown };
    expect(data.delete).toBeUndefined();
    data.image.subscribe();
    expect(downloadImage).toHaveBeenCalledWith('a1');
  });

  it('„Verwerfen“ fragt nach, löscht, entfernt den Eintrag und geht zur Analyse-Liste', async () => {
    await setup();

    button('Verwerfen').click();
    await settle();

    expect(openConfirmation).toHaveBeenCalledTimes(1);
    expect(deleteAnalyzedBill).toHaveBeenCalledWith('a1');
    expect(remove).toHaveBeenCalledWith('a1');
    expect(navigateByUrl).toHaveBeenCalledWith('/bill/analysis');
  });

  it('„Verwerfen“ abgelehnt: nichts passiert', async () => {
    await setup({ confirmed: false });

    button('Verwerfen').click();
    await settle();

    expect(deleteAnalyzedBill).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('„Verwerfen“ fehlgeschlagen: Fehlermeldung, Eintrag bleibt', async () => {
    await setup({ deleteAnalyzedBill: () => throwError(() => new Error('offline')) });

    button('Verwerfen').click();
    await settle();

    expect(openSnackbar).toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('„Als Rechnung übernehmen“ öffnet das Formular mit Vorbelegung, Analyse-ID und geladenem Foto (AC33)', async () => {
    await setup();

    button('Als Rechnung übernehmen').click();
    await settle();

    expect(downloadImage).toHaveBeenCalledWith('a1');
    expect(navigate).toHaveBeenCalledTimes(1);
    const [commands, extras] = navigate.mock.calls[0] as [unknown[], { state: { prefill: BillCreatePrefill } }];
    expect(commands).toEqual(['/bill/create']);
    const { image, ...fields } = extras.state.prefill;
    expect(fields).toEqual({
      analyzedBillId: 'a1', shopName: 'Billa', price: 12.5, date: '2026-11-03', categoryId: 'c1', subCategoryId: 's1'
    });
    expect(image).toBeInstanceOf(File);
    expect(image!.type).toBe('image/jpeg');
    expect(image!.size).toBe(3);
  });

  it('„Als Rechnung übernehmen“ ohne Foto: Vorbelegung ohne Bild', async () => {
    await setup({ bill: { ...bill, imageAvailable: false, categoryId: undefined, subCategoryId: undefined } });

    button('Als Rechnung übernehmen').click();
    await settle();

    expect(downloadImage).not.toHaveBeenCalled();
    const extras = navigate.mock.calls[0][1] as { state: { prefill: BillCreatePrefill } };
    expect(extras.state.prefill.image).toBeUndefined();
    expect(extras.state.prefill.categoryId).toBeUndefined();
    expect(extras.state.prefill.analyzedBillId).toBe('a1');
  });

  it('„Als Rechnung übernehmen“: Foto nicht ladbar → Fehlermeldung, keine Navigation', async () => {
    await setup({ downloadImage: () => throwError(() => new Error('offline')) });

    button('Als Rechnung übernehmen').click();
    await settle();

    expect(openSnackbar).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
