import { HttpEvent, HttpEventType } from '@angular/common/http';
import { DestroyRef, Injectable, Signal, computed, effect, inject, signal, untracked } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Observable, Subject, Subscription, catchError, filter, finalize, from, map, of, switchMap, take } from 'rxjs';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { AutoCreatedBillDto } from 'src/app/api/shopping/dtos/AutoCreatedBillDto';
import { PendingAnalysisDto } from 'src/app/api/shopping/dtos/PendingAnalysisDto';
import { ContextService } from 'src/app/core/context.service';
import { OnlineStatusService } from 'src/app/core/online-status.service';
import { BillContextService } from 'src/app/features/bill/services/bill-context.service';
import { openErrorSnackbar, openInformationSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { compressImage } from 'src/app/shared/utils/image-utils';
import { AnalyzedBillContextService } from './analyzed-bill-context.service';

export type LocalUploadState = 'uploading' | 'analyzing' | 'failed';

/** Ein auf diesem Gerät gestarteter Upload, solange er nicht fertig analysiert ist */
export interface LocalUpload {
  localId: string;
  /** Object-URL des gewählten Fotos (Vorschaubild) */
  previewUrl: string;
  fileName: string;
  state: LocalUploadState;
  /** Upload-Fortschritt in Prozent */
  progress: number;
  /** Bild-ID vom Server (ab `analyzing`); entspricht `pending.id` und später `sourceUploadId` */
  serverId?: string;
}

export const UPLOAD_OFFLINE = 'Ohne Verbindung können keine Rechnungen hochgeladen werden.';

export function analysisStartedMessage(count: number): string {
  return count === 1 ? '1 Rechnung wird analysiert' : `${count} Rechnungen werden analysiert`;
}

const MAX_PARALLEL_UPLOADS = 3;
const IMAGE_MAX_EDGE = 1600;
const IMAGE_QUALITY = 0.8;
const FAST_POLL_MS = 3_000;
const SLOW_POLL_MS = 15_000;
/** Nach so langer Zeit ohne Änderung wird nur noch im langsamen Takt abgefragt */
const SLOW_DOWN_AFTER_MS = 2 * 60_000;

interface PollResult {
  pending: PendingAnalysisDto[] | null;
  today: AutoCreatedBillDto[] | null;
}

/**
 * Hochladen zur Analyse (mehrere Fotos, Fortschritt) und Abfragen von „In Arbeit“, „Zu prüfen“ und „Angelegt“
 * (US-0009 §2, §4). Root-Dienst, damit Uploads und Badge auch ohne offenen Tab weiterlaufen.
 */
@Injectable({ providedIn: 'root' })
export class AnalysisUploadService {
  private readonly billApi = inject(BillApiService);
  private readonly analyzedBills = inject(AnalyzedBillContextService);
  private readonly bills = inject(BillContextService);
  private readonly onlineStatus = inject(OnlineStatusService);
  private readonly snackbar = inject(MatSnackBar);
  private readonly router = inject(Router);

  private readonly uploadsState = signal<LocalUpload[]>([]);
  private readonly pendingState = signal<PendingAnalysisDto[]>([]);
  private readonly todayState = signal<AutoCreatedBillDto[]>([]);
  private readonly completedSubject = new Subject<{ serverId: string }>();

  readonly uploads: Signal<LocalUpload[]> = this.uploadsState.asReadonly();
  readonly pending: Signal<PendingAnalysisDto[]> = this.pendingState.asReadonly();
  readonly todayCreated: Signal<AutoCreatedBillDto[]> = this.todayState.asReadonly();
  /** Upload, dessen Bild nicht mehr in `pending` steht: fertig analysiert (der Tab hebt das Ergebnis hervor) */
  readonly completed$: Observable<{ serverId: string }> = this.completedSubject.asObservable();

  /** Server-`pending` ohne lokalen Upload (anderes Gerät, nach Neuladen); lokale zählen über `serverId` nicht doppelt */
  private readonly serverOnlyPending = computed(() => {
    const localServerIds = new Set(this.uploadsState().map(upload => upload.serverId));
    return this.pendingState().filter(pending => !localServerIds.has(pending.id)).length;
  });

  /**
   * „In Arbeit“: lokale Uploads (wird hochgeladen, fehlgeschlagen, und analysierend bis zur Erledigt-Erkennung)
   * plus Server-`pending` ohne lokale Entsprechung.
   */
  readonly inProgressCount: Signal<number> = computed(() => this.uploadsState().length + this.serverOnlyPending());

  /** Abfragen lohnt nur, solange sich serverseitig etwas tut; ein fehlgeschlagener Upload wartet auf den Nutzer */
  private readonly hasRunningWork = computed(() =>
    this.uploadsState().some(upload => upload.state !== 'failed') || this.serverOnlyPending() > 0);

  private readonly files = new Map<string, File>();
  /** GUID je lokalem Upload, über „Erneut versuchen“ hinweg gleich: der Server legt das Bild nur einmal an */
  private readonly uploadIds = new Map<string, string>();
  private readonly queue: string[] = [];
  private readonly running = new Map<string, Subscription>();
  /** Abfrage-Nummer beim Wechsel nach `analyzing`: nur spätere Abfragen dürfen den Upload als fertig melden */
  private readonly analyzingSincePoll = new Map<string, number>();

  private nextLocalId = 0;
  private pollSequence = 0;
  private appliedPollSequence = 0;
  private pollsInFlight = 0;
  private pollTimer: ReturnType<typeof setTimeout> | undefined;
  private lastChangeAt = Date.now();
  private lastPollSignature = '';
  private destroyed = false;

  constructor() {
    // zurück im Vordergrund bzw. wieder online: einmal sofort abfragen, auch ohne laufende Arbeit (nach Mitternacht
    // verschwindet Gestriges aus „Angelegt“, Einträge vom NAS bzw. anderen Gerät erscheinen); im Takt weiter nur,
    // solange etwas läuft (schedulePoll). Verdeckt bzw. offline: pausieren
    const resumeOrPause = () => {
      if (!this.canPoll()) {
        this.clearPollTimer();
      } else {
        this.poll();
      }
    };
    document.addEventListener('visibilitychange', resumeOrPause);

    let wasOnline = this.onlineStatus.online();
    effect(() => {
      const online = this.onlineStatus.online();
      if (online !== wasOnline) {
        wasOnline = online;
        untracked(resumeOrPause);
      }
    });

    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      document.removeEventListener('visibilitychange', resumeOrPause);
      this.clearPollTimer();
    });

    // „In Arbeit“ und Badge stimmen auch nach einem Neuladen; die Analyse-Liste lädt ihr eigener Dienst
    inject(ContextService).backendReady()
      .pipe(filter(ready => ready), take(1))
      .subscribe(() => this.poll(false));
  }

  uploadAll(files: File[]): void {
    if (files.length === 0) {
      return;
    }

    if (!this.onlineStatus.online()) {
      openErrorSnackbar(UPLOAD_OFFLINE, this.snackbar);
      return;
    }

    const added = files.map(file => {
      const localId = `upload-${++this.nextLocalId}`;
      this.files.set(localId, file);
      this.uploadIds.set(localId, crypto.randomUUID());
      const upload: LocalUpload = {
        localId,
        previewUrl: URL.createObjectURL(file),
        fileName: file.name,
        state: 'uploading',
        progress: 0
      };
      return upload;
    });

    this.uploadsState.update(uploads => [...uploads, ...added]);
    this.queue.push(...added.map(upload => upload.localId));
    this.startQueuedUploads();
    this.markChanged();
    this.schedulePoll();

    openInformationSnackbar(analysisStartedMessage(files.length), this.snackbar, { action: 'Anzeigen' })
      .onAction()
      .subscribe(() => this.router.navigateByUrl('/bill/analysis'));
  }

  retry(localId: string): void {
    const upload = this.uploadsState().find(u => u.localId === localId);
    if (!upload || upload.state !== 'failed') {
      return;
    }

    this.patch(localId, { state: 'uploading', progress: 0, serverId: undefined });
    this.queue.push(localId);
    this.startQueuedUploads();
    this.markChanged();
    this.schedulePoll();
  }

  remove(localId: string): void {
    this.running.get(localId)?.unsubscribe();
    const queued = this.queue.indexOf(localId);
    if (queued >= 0) {
      this.queue.splice(queued, 1);
    }
    this.drop(localId);
  }

  /** Sofort abfragen: `pending`, die Analyse-Liste und `today` */
  refresh(): void {
    this.poll();
  }

  private startQueuedUploads(): void {
    while (!this.destroyed && this.running.size < MAX_PARALLEL_UPLOADS && this.queue.length > 0) {
      this.startUpload(this.queue.shift()!);
    }
  }

  private startUpload(localId: string): void {
    const file = this.files.get(localId)!;
    const uploadId = this.uploadIds.get(localId)!;
    const subscription = new Subscription();
    this.running.set(localId, subscription);

    subscription.add(
      from(compressImage(file, IMAGE_MAX_EDGE, IMAGE_QUALITY)).pipe(
        switchMap(image => this.billApi.uploadForAnalysis(image, image.name || file.name, uploadId)),
        finalize(() => {
          this.running.delete(localId);
          this.startQueuedUploads();
        })
      ).subscribe({
        next: event => this.onUploadEvent(localId, event),
        // kein Snackbar pro Upload: der Eintrag zeigt „Upload fehlgeschlagen“ mit „Erneut versuchen“
        error: () => this.patch(localId, { state: 'failed' })
      })
    );
  }

  private onUploadEvent(localId: string, event: HttpEvent<{ id: string }>): void {
    if (event.type === HttpEventType.UploadProgress) {
      const progress = event.total ? Math.round(event.loaded / event.total * 100) : 0;
      this.patch(localId, { progress });
    } else if (event.type === HttpEventType.Response) {
      const serverId = event.body?.id;
      if (!serverId) {
        this.patch(localId, { state: 'failed' });
        return;
      }
      this.analyzingSincePoll.set(localId, this.pollSequence);
      this.patch(localId, { state: 'analyzing', progress: 100, serverId });
      this.schedulePoll();
    }
  }

  private poll(reloadAnalyzedBills: boolean = true): void {
    this.clearPollTimer();
    const sequence = ++this.pollSequence;
    this.pollsInFlight++;

    // `today` und die Analyse-Liste erst nach `pending`: was dort fehlt, ist in den Ergebnissen schon enthalten
    this.billApi.getPendingAnalyses().pipe(
      catchError(() => of(null)),
      switchMap(pending => {
        if (reloadAnalyzedBills) {
          // still: kein Ladezustand, keine globale Snackbar im 3-Sekunden-Takt (Review Focus 1)
          this.analyzedBills.refresh({ silent: true });
        }
        return this.billApi.getTodayAutoCreated().pipe(
          catchError(() => of(null)),
          map((today): PollResult => ({ pending, today }))
        );
      }),
      finalize(() => {
        this.pollsInFlight--;
        this.schedulePoll();
      })
    ).subscribe(result => this.applyPollResult(sequence, result));
  }

  private applyPollResult(sequence: number, { pending, today }: PollResult): void {
    if (sequence < this.appliedPollSequence) {
      return; // eine neuere Abfrage hat schon geantwortet
    }
    this.appliedPollSequence = sequence;

    if (today) {
      // neu angelegte Rechnung: die Rechnungsliste einmal neu laden, sonst fehlt sie dort bis zum Pull-to-Refresh.
      // Ausgangsstand ist eine leere Menge: bringt schon die erste Abfrage nach dem Start Rechnungen (anderes Gerät,
      // Upload vor dem Neuladen), wird einmal geladen; ohne neue Rechnungen nicht
      const known = new Set(this.todayState().map(t => t.billId));
      const hasNewBill = today.some(t => !known.has(t.billId));
      this.todayState.set(today);
      if (hasNewBill) {
        this.bills.refreshBills();
      }
    }
    if (pending) {
      this.pendingState.set(pending);
      this.completeFinishedUploads(sequence, pending);
    }

    const signature = JSON.stringify([
      this.pendingState().map(p => [p.id, p.state]),
      this.todayState().map(t => t.billId)
    ]);
    if (signature !== this.lastPollSignature) {
      this.lastPollSignature = signature;
      this.markChanged();
    }
  }

  private completeFinishedUploads(sequence: number, pending: PendingAnalysisDto[]): void {
    const pendingIds = new Set(pending.map(p => p.id));
    const finished = this.uploadsState().filter(upload =>
      upload.state === 'analyzing'
      && upload.serverId !== undefined
      && !pendingIds.has(upload.serverId)
      && sequence > (this.analyzingSincePoll.get(upload.localId) ?? Number.POSITIVE_INFINITY));

    for (const upload of finished) {
      this.drop(upload.localId);
      this.completedSubject.next({ serverId: upload.serverId! });
    }
  }

  private schedulePoll(): void {
    if (this.destroyed
      || this.pollTimer !== undefined
      || this.pollsInFlight > 0
      || !this.canPoll()
      || !this.hasRunningWork()) {
      return;
    }

    const interval = Date.now() - this.lastChangeAt >= SLOW_DOWN_AFTER_MS ? SLOW_POLL_MS : FAST_POLL_MS;
    this.pollTimer = setTimeout(() => {
      this.pollTimer = undefined;
      if (this.canPoll()) {
        this.poll();
      }
    }, interval);
  }

  /** Kein Abfragen im Hintergrund (App verdeckt) und ohne Verbindung */
  private canPoll(): boolean {
    return document.visibilityState !== 'hidden' && this.onlineStatus.online();
  }

  private clearPollTimer(): void {
    if (this.pollTimer !== undefined) {
      clearTimeout(this.pollTimer);
      this.pollTimer = undefined;
    }
  }

  private markChanged(): void {
    this.lastChangeAt = Date.now();
  }

  private patch(localId: string, changes: Partial<LocalUpload>): void {
    this.uploadsState.update(uploads =>
      uploads.map(upload => upload.localId === localId ? { ...upload, ...changes } : upload));
  }

  private drop(localId: string): void {
    const upload = this.uploadsState().find(u => u.localId === localId);
    if (upload) {
      URL.revokeObjectURL(upload.previewUrl);
    }
    this.files.delete(localId);
    this.uploadIds.delete(localId);
    this.analyzingSincePoll.delete(localId);
    this.uploadsState.update(uploads => uploads.filter(u => u.localId !== localId));
  }
}
