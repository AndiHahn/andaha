import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button'
import { CommonModule } from '@angular/common';
import { OverviewComponent } from './modules/overview/overview.component';
import { AppConfigService } from './core/app-config.service';
import { ErrorHttpInterceptor } from './core/error-http-interceptor.service';

function initializeAppFactory(appConfigService: AppConfigService) {
  return () => initApp(appConfigService);
}

async function initApp(appConfigService: AppConfigService): Promise<void> {
  await appConfigService.init();
}

@NgModule({
  declarations: [
    AppComponent,
    OverviewComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    CommonModule,
    HttpClientModule,
    MatButtonModule,
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppFactory,
      deps: [ AppConfigService ],
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorHttpInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
