import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { AuthService } from './core/auth.service';
import { BillContextService } from './features/bill/services/bill-context.service';
import { map, shareReplay } from 'rxjs/operators';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { HeaderAction, PageTitleService } from './core/page-title/page-title.service';
import { AppUpdateService } from './core/app-update.service';
import { MatSidenavContainer, MatSidenav, MatSidenavContent } from '@angular/material/sidenav';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { AsyncPipe } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { BottomBarComponent } from './core/navigation/bottom-bar/bottom-bar.component';
import { OfflineBannerComponent } from './core/offline-banner/offline-banner.component';
import { currentUrl$ } from './core/navigation/current-url';
import { MenuBackDirective } from './core/overlay/menu-back.directive';
import { findArea, LEGAL_LINKS, MORE_DATA, MORE_SETTINGS, NAV_AREAS, NavArea } from './core/navigation/nav-areas';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatSidenavContainer, MatSidenav, MatIcon, RouterLink, RouterLinkActive, MatSidenavContent, MatMenuTrigger, MatMenu, MatMenuItem, MenuBackDirective, RouterOutlet, AsyncPipe, BottomBarComponent, OfflineBannerComponent, MatProgressSpinner]
})
export class AppComponent implements OnInit {
  private appUpdateService = inject(AppUpdateService);
  private authService = inject(AuthService);
  private billContextService = inject(BillContextService);
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);

  title = 'Andaha.WebApps.MiniClient';

  isDisabled = true;

  userName: string = '';
  isLoggedIn: boolean = false;
  syncActive: boolean = true;

  // Desktop-Sidebar: Bereiche mit Tabs, darunter Gruppe „Mehr“ und Rechtliches
  readonly mainAreas = NAV_AREAS.filter(area => area.id !== 'more');
  readonly moreLinks = [...MORE_SETTINGS, ...MORE_DATA];
  readonly legalLinks = LEGAL_LINKS;
  readonly activeAreaId$: Observable<NavArea['id'] | undefined> = currentUrl$(this.router).pipe(map(url => findArea(url)?.id));

  readonly isDesktop$: Observable<boolean>;
  readonly title$: Observable<string>;
  readonly back$: Observable<string | null>;
  readonly action$: Observable<HeaderAction | null>;

  constructor() {
    const pageTitleService = inject(PageTitleService);

    this.isDesktop$ = this.breakpointObserver.observe('(min-width: 1024px)').pipe(
      map(state => state.matches),
      shareReplay({ bufferSize: 1, refCount: true }));
    this.title$ = pageTitleService.title$;
    this.back$ = pageTitleService.back$;
    this.action$ = pageTitleService.action$;
    this.initSubscriptions();
  }

  ngOnInit(): void {
    this.appUpdateService.init();
  }

  logout(): void {
    this.authService.logout();
  }

  private initSubscriptions(): void {
    this.authService.loggedIn().subscribe(
      {
        next: isLoggedIn => this.isLoggedIn = isLoggedIn
      }
    );

    this.authService.userInfo().subscribe(
      {
        next: userInfo => this.userName = userInfo.userName
      }
    );

    this.billContextService.syncing().subscribe(
      {
        next: syncing => this.syncActive = syncing
      }
    );
  }
}
