import { Component } from '@angular/core';
import { ShoppingApiService } from './api/shopping/shopping-api.service';
import { ContextService } from './core/context.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Andaha.WebApps.MiniClient';

  isDisabled = true;

  constructor(context: ContextService) {
  }
}
