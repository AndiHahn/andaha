import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule, DatePipe, registerLocaleData } from '@angular/common';
import { ErrorHttpInterceptor } from './core/error-http-interceptor.service';
import { OAuthModule, OAuthStorage } from 'angular-oauth2-oidc';
import { AuthService } from './core/auth.service';
import { environment } from 'src/environments/environment';
import { ServiceWorkerModule } from '@angular/service-worker';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import localeDe from '@angular/common/locales/de';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AppSnackbarModule } from './shared/snackbar/snackbar.module';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_SELECT_CONFIG, MatSelectConfig } from '@angular/material/select';
import { OVERLAY_DEFAULT_CONFIG, OverlayDefaultConfig } from '@angular/cdk/overlay';

registerLocaleData(localeDe);

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
          environment.monolithApiBaseUrl,
          'https://localhost:8100/api',
          'https://localhost:8200/api',
          'https://localhost:8300/api',
          'https://localhost:8400/api'
        ],
        sendAccessToken: true
      }
    }),
    BrowserAnimationsModule,
    CommonModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule,
    MatSnackBarModule,
    AppSnackbarModule,
    MatDialogModule,
    MatDatepickerModule,
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
    },
    {
      // CDK 21 rendert Overlays standardmaessig als Popover (Select-Panel inline am Trigger statt im
      // .cdk-overlay-container); die Overlay-Styles in styles.scss setzen den Container voraus
      provide: OVERLAY_DEFAULT_CONFIG,
      useValue: { usePopover: false } as OverlayDefaultConfig
    },
    {
      // MDC-Select (Material 15) zeigt bei Einfachauswahl einen Haken; vorher gab es keinen
      provide: MAT_SELECT_CONFIG,
      useValue: { hideSingleSelectionIndicator: true } as MatSelectConfig
    },
    DatePipe,
    provideHttpClient(withXhr(), withInterceptorsFromDi())
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(iconRegistry: MatIconRegistry) {
    iconRegistry.setDefaultFontSetClass('material-symbols-outlined');
  }
}
