import { Component } from '@angular/core';
import { AuthService } from './core/auth.service';
import { ContextService } from './core/context.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Andaha.WebApps.MiniClient';

  isDisabled = true;

  isLoggedIn: boolean = false;

  constructor(private authService: AuthService, context: ContextService) {
    this.authService.loggedIn().subscribe(
      {
        next: isLoggedIn => this.isLoggedIn = isLoggedIn
      }
    )
  }
}
