import { Component } from '@angular/core';
import { AuthService } from './core/auth.service';
import { BillContextService } from './services/bill-context.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Andaha.WebApps.MiniClient';

  isDisabled = true;

  userName: string = '';
  isLoggedIn: boolean = false;
  syncActive: boolean = true;

  constructor(
    private authService: AuthService,
    private billContextService: BillContextService) {
    this.initSubscriptions();
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
