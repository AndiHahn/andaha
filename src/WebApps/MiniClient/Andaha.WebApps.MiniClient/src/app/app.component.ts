import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from './core/auth.service';
import { BillContextService } from './features/bill/services/bill-context.service';
import { map, shareReplay } from 'rxjs/operators';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { HeaderAction, PageTitleService } from './core/page-title/page-title.service';
import { AppUpdateService } from './core/app-update.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class AppComponent implements OnInit {
  title = 'Andaha.WebApps.MiniClient';

  isDisabled = true;

  userName: string = '';
  isLoggedIn: boolean = false;
  syncActive: boolean = true;

  readonly isDesktop$: Observable<boolean>;
  readonly title$: Observable<string>;
  readonly back$: Observable<string | null>;
  readonly action$: Observable<HeaderAction | null>;

  constructor(
    private appUpdateService: AppUpdateService,
    private authService: AuthService,
    private billContextService: BillContextService,
    private breakpointObserver: BreakpointObserver,
    pageTitleService: PageTitleService) {
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
