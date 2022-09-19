import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button'
import { MatToolbarModule } from '@angular/material/toolbar'
import { CommonModule } from '@angular/common';
import { ErrorHttpInterceptor } from './core/error-http-interceptor.service';
import { OAuthModule, OAuthStorage } from 'angular-oauth2-oidc';
import { AuthService } from './core/auth.service';
import { environment } from 'src/environments/environment';
import { ServiceWorkerModule } from '@angular/service-worker';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

function storageFactory() : OAuthStorage {
  return localStorage
}

function initializeAppFactory(authService: AuthService) {
  return () => initApp(authService);
}

async function initApp(authService: AuthService): Promise<void> {
  authService.init();
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    OAuthModule.forRoot({
      resourceServer: {
        allowedUrls: [
          environment.gatewayBaseUrl,
          'https://localhost:8200/api'
        ],
        sendAccessToken: true
      }
    }),
    BrowserAnimationsModule,
    CommonModule,
    HttpClientModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppFactory,
      deps: [ AuthService ],
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorHttpInterceptor,
      multi: true
    },
    {
      provide: OAuthStorage,
      useFactory: storageFactory
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
