import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AnalysisUploadService } from 'src/app/features/bill-analysis/services/analysis-upload.service';
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

  private readonly toReviewCount = toSignal(
    inject(AnalyzedBillContextService).bills().pipe(map(bills => bills.length)), { initialValue: 0 });
  private readonly inProgressCount = inject(AnalysisUploadService).inProgressCount;

  /** Badge am Tab Scans (US-0009 AC9): „In Arbeit“ plus „Zu prüfen“ */
  readonly analysisCount = computed(() => this.inProgressCount() + this.toReviewCount());

  readonly isTabPage = isTabPage;
  readonly findTabIndex = findTabIndex;
}
