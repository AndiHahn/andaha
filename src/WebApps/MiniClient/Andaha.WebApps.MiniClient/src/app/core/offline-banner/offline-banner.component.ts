import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { OnlineStatusService } from '../online-status.service';

/**
 * App-weites Offline-Banner unter dem Seitenkopf (AC33, Mockup 03 D). Neue Rechnungen werden offline
 * weiter erfasst (US-0005), andere Aktionen scheitern mit der Snackbar des errorInterceptor.
 */
@Component({
  selector: 'app-offline-banner',
  template: `
    @if (!online()) {
      <div class="offline-banner" role="status">
        <mat-icon aria-hidden="true">wifi_off</mat-icon>Keine Verbindung – neue Rechnungen werden später übertragen.
      </div>
    }
  `,
  styleUrls: ['./offline-banner.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatIcon]
})
export class OfflineBannerComponent {
  readonly online = inject(OnlineStatusService).online;
}
