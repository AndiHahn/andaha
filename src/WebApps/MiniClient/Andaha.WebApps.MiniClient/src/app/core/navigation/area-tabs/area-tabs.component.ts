import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AnalyzedBillContextService } from 'src/app/features/bill-analysis/services/analyzed-bill-context.service';
import { currentUrl$ } from '../current-url';
import { findTabIndex, isTabPage, NavArea } from '../nav-areas';

/**
 * Tabs eines Bereichs (v2): Mobile unter der Kopfzeile (46 px, gleich breit), Desktop unter dem Titel.
 * Nur auf den Tab-Seiten selbst sichtbar, Detail- und Formularseiten zeigen keine Tabs.
 */
@Component({
  selector: 'app-area-tabs',
  templateUrl: './area-tabs.component.html',
  styleUrls: ['./area-tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterLink, AsyncPipe]
})
export class AreaTabsComponent {
  @Input({ required: true }) area!: NavArea;

  readonly url$: Observable<string> = currentUrl$(inject(Router));

  /** Anzahl offener Analysen (= Einträge im Analyse-Tab) */
  readonly analysisCount$: Observable<number> = inject(AnalyzedBillContextService).bills().pipe(
    map(bills => bills.length));

  readonly isTabPage = isTabPage;
  readonly findTabIndex = findTabIndex;
}
