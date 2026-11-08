import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject, viewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GERMAN_DATE_PROVIDERS } from 'src/app/shared/date-picker/german-date-providers';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { vibrate } from 'src/app/shared/utils/haptics';
import { duplicatePrefill } from '../../functions/duplicate-prefill';
import { EMPTY, Subject, catchError, takeUntil } from 'rxjs';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { BillLineItemDto } from 'src/app/api/shopping/dtos/BillLineItemDto';
import { LineItemsViewComponent } from './line-items/line-items-view.component';
import { LineItemsEditorComponent } from './line-items/line-items-editor.component';
import { LineItemDraft, sanitizeDrafts } from '../../functions/line-items';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { BillDto } from 'src/app/api/shopping/dtos/BillDto';
import { BillUpdateDto } from 'src/app/api/shopping/dtos/BillUpdateDto';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { BillContextService } from 'src/app/features/bill/services/bill-context.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { ConfirmationDialogData } from 'src/app/shared/confirmation-dialog/ConfirmationDialogData';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { HistoryTrailService } from 'src/app/core/navigation/history-trail.service';
import { getParametersFromRouteRecursive, leaveDetailNotFound } from 'src/app/shared/utils/routing-helper';
import { BillForm, getBillForm } from '../../functions/bill-form-functions';
import { BillCategoryDto } from 'src/app/api/shopping/dtos/BillCategoryDto';
import { BillSubCategoryDto } from 'src/app/api/shopping/dtos/BillSubCategoryDto';
import { MatSelectChange, MatSelect, MatSelectTrigger, MatOption } from '@angular/material/select';
import { BillImageComponent } from '../bill-image/bill-image.component';
import { MatIcon } from '@angular/material/icon';
import { MatDatepickerInput, MatDatepickerToggle, MatDatepickerToggleIcon, MatDatepicker } from '@angular/material/datepicker';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { DecimalPipe, DatePipe } from '@angular/common';
import { ShowErrorPipe } from '../../../../shared/form-field/show-error.pipe';
import { ConfidenceListComponent } from 'src/app/features/bill-analysis/modules/confidence-list/confidence-list.component';
import { PanelBackDirective } from 'src/app/core/overlay/panel-back.directive';

@Component({
    selector: 'app-bill-details',
    templateUrl: './bill-details.component.html',
    styleUrls: ['./bill-details.component.scss'],
    providers: GERMAN_DATE_PROVIDERS,
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [PanelBackDirective, BillImageComponent, FormsModule, ReactiveFormsModule, MatSelect, MatSelectTrigger, MatOption, MatIcon, MatDatepickerInput, MatDatepickerToggle, MatDatepickerToggleIcon, MatDatepicker, MatProgressBar, MatProgressSpinner, DecimalPipe, DatePipe, ShowErrorPipe, LineItemsViewComponent, LineItemsEditorComponent, ConfidenceListComponent]
})
export class BillDetailsComponent implements OnInit, OnDestroy {
  /** Nur Rechnungen aus einer automatischen Analyse tragen Konfidenzen */
  get hasConfidences(): boolean {
    return this.bill?.confidence != null || this.bill?.totalAmountConfidence != null;
  }

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private historyTrail = inject(HistoryTrailService);
  private snackbar = inject(MatSnackBar);
  private confirmationDialog = inject(ConfirmationDialogService);
  private billContextService = inject(BillContextService);
  private billCategoryContextService = inject(BillCategoryContextService);
  private billApiService = inject(BillApiService);


  form!: FormGroup<BillForm>;

  allCategories?: CategoryDto[];

  bill?: BillDto;
  /** Positionen kommen nur aus GET bill/{id}, die Liste liefert sie leer */
  lineItems: BillLineItemDto[] = [];
  /** Erst nach dem Laden bearbeitbar: sonst würde Speichern die Positionen mit [] löschen */
  lineItemsLoaded = false;
  /** Positionen im Bearbeiten-Modus (design.md §5.4); getrennt vom Formular, wirksam beim Speichern */
  readonly lineItemsControl = new FormControl<LineItemDraft[]>([], { nonNullable: true });
  private readonly lineItemsEditor = viewChild(LineItemsEditorComponent);
  /** Suchtext aus `?q=` (Treffer aus der Rechnungssuche) */
  initialQuery = '';
  billCategories?: BillCategoryDto[];
  billSubCategories?: BillSubCategoryDto[];
  /** Neu gewähltes Foto, wird mit dem nächsten Speichern hochgeladen */
  image: File | null = null;
  
  isSaving: boolean = false;
  isDeleting: boolean = false;
  isEditing: boolean = false;
  /** Block „Automatisch erkannt“ aufgeklappt */
  detectedOpen: boolean = false;
  isLoading: boolean = false;
  isExternal: boolean = false;

  private destroy$: Subject<void> = new Subject<void>();

  ngOnInit(): void {
    const billId = getParametersFromRouteRecursive(this.route.snapshot)["id"];
    if (!billId) {
      leaveDetailNotFound(this.historyTrail, this.snackbar, '/bill/list');
      return;
    }

    this.billContextService.loadBillById(billId).pipe(takeUntil(this.destroy$)).subscribe({
      next: bill => {
        if (!bill) {
          leaveDetailNotFound(this.historyTrail, this.snackbar, '/bill/list');
          return;
        }

        this.bill = bill;
        // Rechnung eines verbundenen Kontos: „Löschen“ gesperrt (das Feld wurde bisher nie gesetzt)
        this.isExternal = bill.isExternal;
        this.form = getBillForm(bill);
        this.form.disable();
        this.initSubscriptions();
        this.loadLineItems(billId);
      }
    });
  }

  private loadLineItems(billId: string): void {
    this.initialQuery = this.route.snapshot.queryParamMap.get('q') ?? '';
    // vor dem Request merken: kommt die Sync-Antwort (POST) vor dem 404 eines vor dem Commit gelesenen GET,
    // ist die Rechnung beim 404 schon nicht mehr „wartend“, existiert aber
    const pendingAtStart = this.billContextService.isPendingSync(billId);
    this.billApiService.getBill(billId).pipe(
      catchError(error => {
        // Die Rechnung kam aus der Liste, gibt es am Server aber nicht mehr: wie „unbekannte Rechnung“ behandeln.
        // Ausnahme: lokal gespeichert und noch nicht übertragen (US-0005), beim Start oder beim 404; dann kennt der
        // Server sie (noch) nicht. Andere Fehler: Detail bleibt nutzbar, nur ohne Positionen (kein Editor, lineItems
        // werden nicht gesendet)
        const pending = pendingAtStart || this.billContextService.isPendingSync(billId);
        if (error instanceof HttpErrorResponse && error.status === 404 && !pending) {
          this.billContextService.forgetBill(billId);
          leaveDetailNotFound(this.historyTrail, this.snackbar, '/bill/list');
        }
        return EMPTY;
      }),
      takeUntil(this.destroy$)
    ).subscribe(full => {
      this.lineItems = full.lineItems ?? [];
      this.lineItemsLoaded = true;
      if (!this.lineItemsControl.dirty) {
        this.resetLineItems();
      }
    });
  }

  /** Eigene Rechnung mit geladenen Positionen: Positionen sind bearbeitbar, Partner-Rechnungen nur lesend */
  get canEditLineItems(): boolean {
    return this.lineItemsLoaded && !this.isExternal;
  }

  private resetLineItems(): void {
    this.lineItemsControl.reset(sanitizeDrafts(this.lineItems));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }

  categorySelectionChanged(selection: MatSelectChange): void {
    const category = this.allCategories?.find(c => c.id == selection.value.id);
    this.billSubCategories = category?.subCategories;

    this.form.controls.subCategory.setValue(null);
  }

  onEditClick(): void {
    this.isEditing = true;
    this.form.enable();
    this.resetLineItems();
  }

  onCancelClick(): void {
    this.isEditing = false;
    this.image = null;
    this.resetLineItems();
    this.form = getBillForm(this.bill!);
    this.updateCategory();
    this.form.disable();
  }

  onSaveClick(): void {
    const editLineItems = this.canEditLineItems;
    if (!this.form.valid || (editLineItems && this.lineItemsControl.invalid)) {
      this.lineItemsEditor()?.markAllAsTouched();
      return;
    }

    const dto = this.createModelFromForm();
    // Ersetzen (design.md §5.1); ohne das Feld bleiben die Positionen beim Server unverändert. Nur
    // bearbeitete Positionen gehen mit, sonst überschriebe der Stand beim Öffnen neuere eines anderen Geräts.
    const lineItems = editLineItems && this.lineItemsControl.dirty ? sanitizeDrafts(this.lineItemsControl.value) : undefined;
    dto.lineItems = lineItems;

    this.form.disable();
    this.isEditing = false;
    this.isSaving = true;

    const category = this.getCategoryFromForm();
    const subCategory = this.getSubCategoryFromForm();

    this.billContextService.updateBill(this.bill!.id, dto, this.bill!.imageAvailable, category, subCategory).subscribe(
      {
        next: _ => {
          this.isSaving = false;
          this.image = null;
          // Rechnung kann ausserhalb der geladenen Liste liegen (GET bill/{id}); dann den Stand hier nachziehen.
          Object.assign(this.bill!, {
            shopName: dto.shopName,
            notes: dto.notes,
            price: dto.price,
            date: dto.date,
            category,
            subCategory,
            imageAvailable: dto.image != undefined || this.bill!.imageAvailable
          });
          if (lineItems) {
            // gespeicherter Stand für die Ansicht; die IDs vergibt der Server, hier reichen lokale
            this.lineItems = lineItems.map((item, index) => ({ id: `local-${index}`, ...item }));
            this.resetLineItems();
          }
        },
        error: _ => {
          this.isSaving = false;
          this.isEditing = true;
          this.form.enable();
          openErrorSnackbar("Rechnung konnte nicht gespeichert werden.", this.snackbar);
        } 
      }
    );
  }

  onDeleteClick(): void {
    const data: ConfirmationDialogData = {
      text: 'Soll die Rechnung und alle damit verbundenen Daten wirklich gelöscht werden?'
    }

    this.confirmationDialog.openDialog(data).then(dialogRef => dialogRef.afterClosed().subscribe(
      {
        next: confirmed => {
          if (confirmed) {
            this.delete();
          }
        }
      }
    ));
  }

  /** Großes Formular mit den Werten dieser Rechnung, Datum heute, ohne Foto (design.md §3.1) */
  onDuplicateClick(): void {
    void this.router.navigate(['/bill/create'], { state: { prefill: duplicatePrefill(this.bill!, new Date()) } });
  }

  onImageSelected(image: File | null): void {
    this.image = image;
  }

  private delete(): void {
    this.isDeleting = true;

    this.billContextService.deleteBill(this.bill!.id).subscribe(
      {
        next: _ => {
          this.isDeleting = false;
          vibrate();
          // zurück zur Liste; Zurück führt danach nicht auf den gelöschten Eintrag
          this.historyTrail.leaveTo('/bill/list');
        },
        error: _ => {
          this.isDeleting = false;
          openErrorSnackbar("Rechnung konnte nicht gelöscht werden.", this.snackbar);
        }
      }
    );
  }

  private updateCategory(): void {
    const bill = this.bill;
    if (!bill) {
      return;
    }

    this.updateCategories();

    const category = this.billCategories?.find(category => category.id == bill.category.id);
    if (category) {
      this.form.controls.category.setValue(category);

      const categoryWithSubCategories = this.allCategories?.find(c => c.id == category.id);
      this.billSubCategories = categoryWithSubCategories?.subCategories;

      const subCategory = this.billSubCategories?.find(c => c.id == bill.subCategory?.id);
      if (subCategory) {
        this.form.controls.subCategory.setValue(subCategory);
      }
    }
  }

  private updateCategories(): void {
    const bill = this.bill;
    if (!this.billCategories || !bill) {
      return;
    }
    
    const containsCategory = this.billCategories.some(category => category.id == bill.category.id);
    if (!containsCategory) {
      const categoryWithSameName = this.billCategories.find(category => category.name == bill.category.name);
      if (categoryWithSameName) {
        categoryWithSameName.id = bill.category.id;
        categoryWithSameName.color = bill.category.color;
      } else {
        this.billCategories.push({
          id: bill.category.id,
          name: bill.category.name,
          color: bill.category.color,
          order: bill.category.order
        });
      }
    }
  }

  private initSubscriptions(): void {
    this.billCategoryContextService.categories().pipe(takeUntil(this.destroy$)).subscribe({
      next: categories => {
        this.allCategories = categories;
        this.billCategories = categories.map(c => this.categoryToBillCategory(c));
        this.updateCategory();
      }
    });

    this.billContextService.loading().pipe(takeUntil(this.destroy$)).subscribe(
      {
        next: loading => this.isLoading = loading
      }
    );
  }

  private createModelFromForm(): BillUpdateDto {
    const controls = this.form.controls;
    return {
      categoryId: controls.category.value!.id,
      subCategoryId: controls.subCategory?.value?.id,
      shopName: controls.shopName.value,
      price: controls.price.value!,
      date: new Date(controls.date.value),
      notes: controls.notes?.value ?? undefined,
      image: this.image ?? undefined
    }
  }

  private getCategoryFromForm(): BillCategoryDto {
    const controls = this.form.controls;
    return {
      id: controls.category.value!.id,
      name: controls.category.value!.name,
      color: controls.category.value!.color,
      order: controls.category.value!.order
    }
  }

  private getSubCategoryFromForm(): BillSubCategoryDto | undefined {
    const controls = this.form.controls;

    if (!controls.subCategory.value) {
      return undefined;
    }

    return {
      id: controls.subCategory.value.id,
      name: controls.subCategory.value.name,
      order: controls.subCategory.value.order
    }
  }

  private categoryToBillCategory(category: CategoryDto): BillCategoryDto {
    return {
      id: category.id,
      name: category.name,
      color: category.color,
      order: category.order
    }
  }
}
