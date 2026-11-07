import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { map } from 'rxjs';
import { isPlainClick, TourService } from 'src/app/core/tour/tour.service';
import { BillTemplateContextService } from 'src/app/features/bill/services/bill-template-context.service';
import { LEGAL_LINKS, MORE_DATA, MORE_SETTINGS } from '../nav-areas';

/** Seite „Mehr“ (v2, 01-navigation): alles, was nicht täglich gebraucht wird. */
@Component({
  selector: 'app-more-page',
  templateUrl: './more-page.component.html',
  styleUrls: ['./more-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterLink, MatIcon]
})
export class MorePageComponent {
  readonly sections = [
    { title: 'Einstellungen', links: MORE_SETTINGS },
    { title: 'Daten', links: MORE_DATA }
  ];

  readonly legalLinks = LEGAL_LINKS;

  readonly tour = inject(TourService);
  readonly isPlainClick = isPlainClick;

  readonly templateCount = toSignal(inject(BillTemplateContextService).templates().pipe(map(t => t.length)), { initialValue: 0 });
}
