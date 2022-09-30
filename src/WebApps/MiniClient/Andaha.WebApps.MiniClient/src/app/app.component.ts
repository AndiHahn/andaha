import { Component } from '@angular/core';
import { AuthService } from './core/auth.service';

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

  constructor(private authService: AuthService) {
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
  }
}
