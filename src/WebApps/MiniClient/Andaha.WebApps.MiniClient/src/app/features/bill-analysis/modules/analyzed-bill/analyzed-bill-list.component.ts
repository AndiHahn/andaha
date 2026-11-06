import { ChangeDetectionStrategy, Component, DestroyRef, NgZone, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollableElement, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { BillAnalyzedDto } from 'src/app/api/shopping/dtos/BillAnalyzedDto';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { LoadState, LoadStateComponent } from 'src/app/shared/load-state/load-state.component';
import { takeChosenFiles } from 'src/app/shared/utils/file-utils';
import { AcknowledgedStore } from '../../services/acknowledged-store';
import { AnalysisUploadService } from '../../services/analysis-upload.service';
import { AnalyzedBillContextService } from '../../services/analyzed-bill-context.service';
import { AnalyzedBillListItemComponent } from './analyzed-bill-list-item/analyzed-bill-list-item.component';
import { CreatedRowComponent } from './created-row/created-row.component';
import { InProgressItem, InProgressRowComponent } from './in-progress-row/in-progress-row.component';

/** So lange bleibt ein fertiges Ergebnis hervorgehoben (die Animation selbst dauert 2,4 s) */
const HIGHLIGHT_MS = 3_000;
/** `completed$` kann vor dem Eintrag in der Liste kommen: so lange wartet die Hervorhebung auf ihn */
const HIGHLIGHT_WAIT_MS = 60_000;
/** Takt der Uhr für „dauert länger als üblich“ */
const CLOCK_TICK_MS = 10_000;

/**
 * Tab Scans (US-0009 design.md §4, Change Request 2026-11-06): oben „Foto aufnehmen“ (Kamera) und „Aus Galerie“
 * (mehrere Fotos), immer sichtbar; darunter „In Arbeit“, „Zu prüfen“ (offene Analysen aus US-0007, Virtual Scroll)
 * und „Angelegt“; jeder Abschnitt nur, wenn er Einträge hat. Fertige Uploads werden über `sourceUploadId`
 * in „Zu prüfen“ bzw. „Angelegt“ kurz hervorgehoben.
 */
@Component({
    selector: 'app-analyzed-bill-list',
    templateUrl: './analyzed-bill-list.component.html',
    styleUrls: ['./analyzed-bill-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
      CdkVirtualScrollableElement, CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf, RouterLink,
      MatIcon, LoadStateComponent, AnalyzedBillListItemComponent, InProgressRowComponent, CreatedRowComponent
    ]
})
export class AnalyzedBillListComponent {
  private readonly uploads = inject(AnalysisUploadService);
  private readonly analyzedBills = inject(AnalyzedBillContextService);
  private readonly acknowledged = inject(AcknowledgedStore);
  private readonly zone = inject(NgZone);

  readonly emptyText = 'Keine Scans – fotografiere Rechnungen mit dem Kamera-Knopf oder wähle sie aus der Galerie.';
  readonly pixelHeightPerItem = 64;

  readonly categories = toSignal(inject(BillCategoryContextService).categories(), { initialValue: [] });
  readonly toReview = toSignal(this.analyzedBills.bills(), { initialValue: [] });
  private readonly loading = toSignal(this.analyzedBills.loading(), { initialValue: false });
  private readonly failed = toSignal(this.analyzedBills.failed(), { initialValue: false });

  /** aktuelle Zeit für „dauert länger als üblich“ */
  readonly now = signal(Date.now());

  /** Lokale Uploads plus Server-`pending` ohne lokalen Upload (anderes Gerät, nach Neuladen) */
  readonly inProgress = computed<InProgressItem[]>(() => {
    const pending = this.uploads.pending();
    const uploadedAt = new Map(pending.map(entry => [entry.id, entry.uploadedAt]));
    const local = this.uploads.uploads();
    const localServerIds = new Set(local.map(upload => upload.serverId));

    return [
      ...local.map((upload): InProgressItem => ({
        key: upload.localId,
        localId: upload.localId,
        previewUrl: upload.previewUrl,
        state: upload.state,
        progress: upload.progress,
        since: upload.serverId ? uploadedAt.get(upload.serverId) : undefined
      })),
      ...pending
        .filter(entry => !localServerIds.has(entry.id))
        .map((entry): InProgressItem => ({ key: entry.id, state: 'analyzing', progress: 100, since: entry.uploadedAt }))
    ];
  });

  /** Heute automatisch angelegt, ohne die auf diesem Gerät als erledigt markierten */
  readonly created = computed(() =>
    this.uploads.todayCreated().filter(bill => !this.acknowledged.isAcknowledged(bill.billId)));

  readonly loadState = computed<LoadState>(() => {
    if (this.inProgress().length > 0 || this.toReview().length > 0 || this.created().length > 0) {
      return 'ready';
    }
    if (this.failed()) {
      return 'error';
    }
    return this.loading() ? 'loading' : 'empty';
  });

  /** Upload-IDs (`sourceUploadId`), deren Ergebnis gerade hervorgehoben ist */
  private readonly highlighted = signal<ReadonlySet<string>>(new Set());

  /** Upload-IDs der Einträge in „Zu prüfen“ und „Angelegt“ */
  private readonly listedUploadIds = computed(() => new Set(
    [...this.toReview(), ...this.uploads.todayCreated()]
      .map(entry => entry.sourceUploadId)
      .filter((id): id is string => !!id)));

  /** fertig gemeldete Uploads, deren Ergebnis noch nicht in einer Liste steht */
  private readonly awaitingResult = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly highlightTimers = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    // Tab geöffnet: „In Arbeit“, „Angelegt“ (heute) und still „Zu prüfen“ neu laden, auch ohne lokale Uploads
    this.uploads.refresh();

    this.uploads.completed$
      .pipe(takeUntilDestroyed())
      .subscribe(({ serverId }) => this.awaitResult(serverId));

    // das Ergebnis erscheint oft erst mit einer späteren Abfrage in der Liste
    effect(() => {
      const listed = this.listedUploadIds();
      untracked(() => this.highlightListed(listed));
    });

    // Timer außerhalb der Zone: sie halten die Seite nicht „instabil“; die Signale aktualisieren die Ansicht trotzdem
    const clock = this.zone.runOutsideAngular(() => setInterval(() => this.now.set(Date.now()), CLOCK_TICK_MS));

    inject(DestroyRef).onDestroy(() => {
      clearInterval(clock);
      this.awaitingResult.forEach(timer => clearTimeout(timer));
      this.highlightTimers.forEach(timer => clearTimeout(timer));
    });
  }

  isHighlighted(sourceUploadId: string | null | undefined): boolean {
    return !!sourceUploadId && this.highlighted().has(sourceUploadId);
  }

  trackById(_: number, bill: BillAnalyzedDto): string {
    return bill.id;
  }

  /** „Foto aufnehmen“ bzw. „Aus Galerie“: gleicher Upload-Weg wie der Kamera-Knopf im Dock (inkl. Offline-Hinweis) */
  onPhotosChosen(fileInput: HTMLInputElement): void {
    const files = takeChosenFiles(fileInput);
    if (files.length > 0) {
      // ohne „Anzeigen“: man ist schon im Tab
      this.uploads.uploadAll(files, { openAction: false });
    }
  }

  retryUpload(item: InProgressItem): void {
    if (item.localId) {
      this.uploads.retry(item.localId);
    }
  }

  removeUpload(item: InProgressItem): void {
    if (item.localId) {
      this.uploads.remove(item.localId);
    }
  }

  acknowledge(billId: string): void {
    this.acknowledged.acknowledge(billId);
  }

  retryLoad(): void {
    this.analyzedBills.refresh();
    this.uploads.refresh();
  }

  private awaitResult(serverId: string): void {
    clearTimeout(this.awaitingResult.get(serverId));
    this.awaitingResult.set(serverId, this.zone.runOutsideAngular(() =>
      setTimeout(() => this.awaitingResult.delete(serverId), HIGHLIGHT_WAIT_MS)));
    this.highlightListed(this.listedUploadIds());
  }

  private highlightListed(listed: ReadonlySet<string>): void {
    for (const [serverId, waitTimer] of this.awaitingResult) {
      if (!listed.has(serverId)) {
        continue;
      }
      clearTimeout(waitTimer);
      this.awaitingResult.delete(serverId);
      this.highlighted.update(ids => new Set(ids).add(serverId));

      const endTimer = this.zone.runOutsideAngular(() => setTimeout(() => {
        this.highlightTimers.delete(endTimer);
        this.highlighted.update(ids => new Set([...ids].filter(id => id !== serverId)));
      }, HIGHLIGHT_MS));
      this.highlightTimers.add(endTimer);
    }
  }
}
