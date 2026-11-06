import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, map } from 'rxjs';
import { afterFirstLoad } from 'src/app/shared/utils/load-state';
import { BillApiService } from 'src/app/api/shopping/bill-api.service';
import { BillAnalyzedDto } from 'src/app/api/shopping/dtos/BillAnalyzedDto';
import { ContextService } from 'src/app/core/context.service';

/**
 * Offene Analysen (Analyse-Tab und Badge). Kein Paginator und keine Suche (AC36, design.md §5.2):
 * übernommene und verworfene Einträge verschwinden, die Liste enthält nur offene Analysen.
 */
@Injectable({ providedIn: 'root' })
export class AnalyzedBillContextService {
  private billApi = inject(BillApiService);
  private contextService = inject(ContextService);

  private bills$: BehaviorSubject<BillAnalyzedDto[]> = new BehaviorSubject<BillAnalyzedDto[]>([]);
  private loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private loadState$ = new ReplaySubject<'loaded' | 'failed'>(1);
  private backendIsReady: boolean = false;

  constructor() {
    this.initSubscriptions();
    this.fetchAnalyzedBills();
  }

  bills(): Observable<BillAnalyzedDto[]> { return this.bills$.asObservable(); }
  loading(): Observable<boolean> { return this.loading$.asObservable(); }
  /** Letztes Laden ist fehlgeschlagen (Fehlerzustand im Tab Analyse); ein späteres Laden setzt es zurück */
  failed(): Observable<boolean> { return this.loadState$.pipe(map(state => state === 'failed')); }

  /**
   * Neu laden. `silent` (Abfragen im Takt, US-0009): kein Ladezustand (kein Flackern), Fehler ohne globale
   * Snackbar und ohne Fehlerzustand; die Liste bleibt dann wie sie ist.
   */
  refresh(options?: { silent?: boolean }) {
    if (options?.silent) {
      this.billApi.getAnalyzedBills({ silent: true }).subscribe({
        next: result => {
          this.bills$.next(result);
          this.loadState$.next('loaded');
        },
        error: () => undefined
      });
      return;
    }

    this.fetchAnalyzedBills();
  }

  /** Eintrag sofort entfernen (nach Verwerfen); der Badge zählt mit */
  remove(id: string): void {
    this.bills$.next(this.bills$.value.filter(b => b.id !== id));
  }

  private initSubscriptions(): void {
    this.contextService
      .backendReady()
      .subscribe(
        {
          next: ready =>
          {
            this.backendIsReady = ready;
            if (ready)
            {
              this.fetchAnalyzedBills();
            }
          }
        });
  }

  private fetchAnalyzedBills() {
    this.loading$.next(true);

    this.billApi.getAnalyzedBills().subscribe({
      next: result => {
        this.loading$.next(false);
        this.bills$.next(result);
        this.loadState$.next('loaded');
      },
      error: _ => {
        this.loading$.next(false);
        if (this.backendIsReady) {
          this.loadState$.next('failed');
        }
      }
    });
  }

  getBillById(id: string): BillAnalyzedDto | undefined {
    return this.bills$.value.find(b => b.id == id);
  }

  byId(id: string): Observable<BillAnalyzedDto | undefined> {
    return afterFirstLoad(this.loadState$, () => this.getBillById(id));
  }
}
