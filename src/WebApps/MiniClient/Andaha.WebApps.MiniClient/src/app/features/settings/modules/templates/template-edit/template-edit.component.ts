import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatOption, MatSelect, MatSelectTrigger } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, filter, firstValueFrom, take } from 'rxjs';
import { BillTemplateCreateDto, BillTemplateDto } from 'src/app/api/shopping/dtos/BillTemplateDto';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { BillTemplateContextService } from 'src/app/features/bill/services/bill-template-context.service';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { ShowErrorPipe } from 'src/app/shared/form-field/show-error.pipe';
import { openErrorSnackbar, openInformationSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { getParametersFromRouteRecursive } from 'src/app/shared/utils/routing-helper';

const LIST_URL = '/settings/templates';

type ShopMode = 'fixed' | 'choose';

function notBlank(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  return typeof value === 'string' && value.trim() ? null : { required: true };
}

/** Vorlage anlegen und bearbeiten (v2, 03-vorlagen, Bilder c und d). */
@Component({
  selector: 'app-template-edit',
  templateUrl: './template-edit.component.html',
  styleUrls: ['./template-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterLink, ReactiveFormsModule, MatSelect, MatSelectTrigger, MatOption, MatIcon, MatProgressSpinner, ShowErrorPipe]
})
export class TemplateEditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);
  private confirmationDialog = inject(ConfirmationDialogService);
  private templateContext = inject(BillTemplateContextService);
  private destroyRef = inject(DestroyRef);
  private categories$ = inject(BillCategoryContextService).categories();

  readonly categories = toSignal(this.categories$, { initialValue: [] as CategoryDto[] });

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    shopMode: new FormControl<ShopMode>('fixed', { nonNullable: true }),
    shopName: new FormControl('', { nonNullable: true }),
    categoryId: new FormControl<string | null>(null, [Validators.required]),
    subCategoryId: new FormControl<string | null>(null)
  });

  readonly loaded = toSignal(this.templateContext.loaded(), { initialValue: false });
  readonly failed = toSignal(this.templateContext.loadFailed(), { initialValue: false });

  readonly ready = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);

  /** null beim Anlegen */
  templateId: string | null = null;

  private lastCategoryId: string | null = null;

  get category(): CategoryDto | undefined {
    return this.categories().find(c => c.id === this.form.controls.categoryId.value);
  }

  ngOnInit(): void {
    this.templateId = getParametersFromRouteRecursive(this.route.snapshot)['id'] ?? null;

    this.form.controls.shopMode.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateShopValidator());
    this.form.controls.categoryId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(id => {
      if (id !== this.lastCategoryId) {
        this.lastCategoryId = id;
        this.form.controls.subCategoryId.setValue(null);
      }
    });
    this.updateShopValidator();

    combineLatest([this.categories$, this.templateContext.templates(), this.templateContext.loaded(), this.templateContext.loadFailed()]).pipe(
      // Die Standardkategorie existiert immer, eine leere Liste heisst: noch nicht geladen
      // Beim Anlegen werden nur die Kategorien gebraucht, beim Bearbeiten auch die Vorlagen
      filter(([categories, , loaded, failed]) => (this.templateId === null || (loaded && !failed)) && categories.length > 0),
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(([categories, templates]) => {
      if (this.templateId === null) {
        this.ready.set(true);
        return;
      }
      const template = templates.find(t => t.id === this.templateId);
      if (!template) {
        openInformationSnackbar('Eintrag wurde nicht gefunden.', this.snackbar);
        this.router.navigateByUrl(LIST_URL);
        return;
      }
      this.fill(template, categories);
      this.ready.set(true);
    });
  }

  retry(): void {
    this.templateContext.refresh();
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const dto: BillTemplateCreateDto = {
      name: value.name.trim() || undefined,
      shopName: value.shopMode === 'choose' ? null : value.shopName.trim(),
      categoryId: value.categoryId!,
      subCategoryId: value.subCategoryId
    };
    this.isSaving.set(true);
    try {
      await this.templateContext.save(this.templateId, dto);
      this.router.navigateByUrl(LIST_URL);
    } catch {
      openErrorSnackbar('Vorlage konnte nicht gespeichert werden.', this.snackbar);
    } finally {
      this.isSaving.set(false);
    }
  }

  async onDelete(): Promise<void> {
    if (this.templateId === null) {
      return;
    }
    const dialog = await this.confirmationDialog.openDialog({ text: 'Soll die Vorlage wirklich gelöscht werden? Bereits erfasste Rechnungen bleiben unverändert.' });
    if (!(await firstValueFrom(dialog.afterClosed()))) {
      return;
    }
    this.isDeleting.set(true);
    try {
      await this.templateContext.remove(this.templateId);
      this.router.navigateByUrl(LIST_URL);
    } catch {
      openErrorSnackbar('Vorlage konnte nicht gelöscht werden.', this.snackbar);
    } finally {
      this.isDeleting.set(false);
    }
  }

  private fill(template: BillTemplateDto, categories: CategoryDto[]): void {
    // Kategorie inzwischen gelöscht: Auswahl leeren, damit eine neue gewählt werden muss
    const category = categories.find(c => c.id === template.categoryId);
    this.lastCategoryId = category?.id ?? null;
    this.form.setValue({
      name: template.name ?? '',
      shopMode: template.shopName == null ? 'choose' : 'fixed',
      shopName: template.shopName ?? '',
      categoryId: category?.id ?? null,
      subCategoryId: category?.subCategories.some(s => s.id === template.subCategoryId) ? template.subCategoryId ?? null : null
    });
  }

  private updateShopValidator(): void {
    const shopName = this.form.controls.shopName;
    if (this.form.controls.shopMode.value === 'fixed') {
      shopName.setValidators(notBlank);
    } else {
      shopName.clearValidators();
    }
    shopName.updateValueAndValidity();
  }
}
