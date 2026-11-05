import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, combineLatest, firstValueFrom, map, Observable } from 'rxjs';
import { BillSuggestionDto, BillSuggestionKey } from 'src/app/api/shopping/dtos/BillSuggestionDto';
import { BillTemplateCreateDto, BillTemplateDto } from 'src/app/api/shopping/dtos/BillTemplateDto';
import { HiddenBillSuggestionDto } from 'src/app/api/shopping/dtos/HiddenBillSuggestionDto';
import { BillTemplateApiService } from 'src/app/api/shopping/bill-template-api.service';
import { ContextService } from 'src/app/core/context.service';

/** So lange wartet die Verwaltung auf das Backend, bevor sie einen Fehler zeigt. */
export const BACKEND_WAIT_MS = 8000;

@Injectable({
  providedIn: 'root'
})
export class BillTemplateContextService {
  private contextService = inject(ContextService);
  private api = inject(BillTemplateApiService);

  private templates$ = new BehaviorSubject<BillTemplateDto[]>([]);
  private suggestions$ = new BehaviorSubject<BillSuggestionDto[]>([]);
  private loaded$ = new BehaviorSubject<boolean>(false);
  private loadFailed$ = new BehaviorSubject<boolean>(false);
  private backendTimedOut$ = new BehaviorSubject<boolean>(false);
  private backendIsReady = false;
  private backendTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.contextService.backendReady().subscribe(ready => {
      if (ready) {
        this.backendIsReady = true;
        clearTimeout(this.backendTimer);
        this.backendTimedOut$.next(false);
        this.refresh();
      }
    });
    this.armBackendTimer();
  }

  templates(): Observable<BillTemplateDto[]> {
    return this.templates$.asObservable();
  }

  suggestions(): Observable<BillSuggestionDto[]> {
    return this.suggestions$.asObservable();
  }

  /**
   * true, sobald Vorlagen und Vorschläge einmal beide geladen (oder fehlgeschlagen) sind; bleibt
   * danach true. Vorher sind die leeren Listen nur der Startwert.
   */
  loaded(): Observable<boolean> {
    return this.loaded$.asObservable();
  }

  /** true, wenn das letzte Laden von Vorlagen oder Vorschlägen fehlgeschlagen ist */
  loadFailed(): Observable<boolean> {
    return combineLatest([this.loadFailed$, this.backendTimedOut$]).pipe(map(([failed, timedOut]) => failed || timedOut));
  }

  /** Erneut versuchen: Backend erneut wecken (lädt dann automatisch) bzw. direkt neu laden. */
  retry(): void {
    this.backendTimedOut$.next(false);
    if (this.backendIsReady) {
      this.refresh();
    } else {
      this.contextService.retryWakeUp();
      this.armBackendTimer();
    }
  }

  private armBackendTimer(): void {
    clearTimeout(this.backendTimer);
    if (!this.backendIsReady) {
      this.backendTimer = setTimeout(() => this.backendTimedOut$.next(true), BACKEND_WAIT_MS);
    }
  }

  refresh(): void {
    let pending = 2;
    let failed = false;
    const settled = () => {
      if (--pending === 0) {
        this.loadFailed$.next(failed);
        if (!this.loaded$.value) {
          this.loaded$.next(true);
        }
      }
    };
    this.api.list().subscribe({
      next: templates => this.templates$.next(templates),
      error: error => {
        console.error('Loading bill templates failed', error);
        failed = true;
        settled();
      },
      complete: settled
    });
    this.api.suggestions().subscribe({
      next: suggestions => this.suggestions$.next(suggestions),
      error: error => {
        console.error('Loading bill suggestions failed', error);
        failed = true;
        settled();
      },
      complete: settled
    });
  }

  async pin(s: BillSuggestionDto): Promise<BillTemplateDto> {
    const created = await firstValueFrom(this.api.create({
      shopName: s.shopName,
      categoryId: s.categoryId,
      subCategoryId: s.subCategoryId ?? null
    }));
    this.refresh();
    return created;
  }

  async hide(s: BillSuggestionKey): Promise<void> {
    await firstValueFrom(this.api.hideSuggestion(s));
    this.refresh();
  }


  /** Ausgeblendete Vorschläge (Mehr → Vorlagen, Abschnitt „Ausgeblendet“), bei jedem Aufruf frisch vom Server */
  listHiddenSuggestions(): Observable<HiddenBillSuggestionDto[]> {
    return this.api.listHiddenSuggestions();
  }

  /** „Wieder anzeigen“: der Vorschlag erscheint danach wieder in Schnellerfassung und Vorschlagsliste */
  async unhideSuggestion(id: string): Promise<void> {
    await firstValueFrom(this.api.unhideSuggestion(id));
    this.refresh();
  }

  async reorder(ids: string[]): Promise<void> {
    const byId = new Map(this.templates$.value.map(t => [t.id, t]));
    const previous = this.templates$.value;
    this.templates$.next(ids.flatMap((id, i) => byId.has(id) ? [{ ...byId.get(id)!, sortOrder: i }] : []));
    try {
      await firstValueFrom(this.api.updateOrder(ids));
    } catch (error) {
      this.templates$.next(previous);
      throw error;
    }
    this.refresh();
  }

  async save(id: string | null, dto: BillTemplateCreateDto): Promise<void> {
    if (id === null) {
      await firstValueFrom(this.api.create(dto));
    } else {
      await firstValueFrom(this.api.update(id, dto));
    }
    this.refresh();
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.api.delete(id));
    this.refresh();
  }
}
