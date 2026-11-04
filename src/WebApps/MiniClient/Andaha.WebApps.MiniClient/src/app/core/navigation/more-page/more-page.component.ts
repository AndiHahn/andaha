import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
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
}
