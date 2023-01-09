import { Component, OnInit } from '@angular/core';
import { AuthService } from './core/auth.service';
import { BillContextService } from './features/bill/services/bill-context.service';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Andaha.WebApps.MiniClient';

  isDisabled = true;

  userName: string = '';
  isLoggedIn: boolean = false;
  syncActive: boolean = true;

  constructor(
    private serviceWorkerUpdate: SwUpdate,
    private authService: AuthService,
    private billContextService: BillContextService) {
    this.initSubscriptions();
  }

  ngOnInit(): void {
    this.serviceWorkerUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(
        {
          next: _ => this.serviceWorkerUpdate.activateUpdate().then(_ => document.location.reload())
        }
      );
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
