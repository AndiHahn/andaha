import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { currentUrl$ } from '../current-url';
import { findArea, NAV_AREAS, NavArea } from '../nav-areas';

/** Hauptleiste unten (Mobile, < 1024 px), 64 px hoch: Rechnungen · Haushalt · Stunden · Mehr. */
@Component({
  selector: 'app-bottom-bar',
  templateUrl: './bottom-bar.component.html',
  styleUrls: ['./bottom-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterLink, MatIcon, AsyncPipe]
})
export class BottomBarComponent {
  readonly areas = NAV_AREAS;

  readonly activeId$: Observable<NavArea['id'] | undefined> = currentUrl$(inject(Router)).pipe(
    map(url => findArea(url)?.id));
}
