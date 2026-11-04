import { ApplicationConfig, inject, provideAppInitializer, provideEnvironmentInitializer, provideZoneChangeDetection } from '@angular/core';
import { DatePipe, registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { OVERLAY_DEFAULT_CONFIG, OverlayDefaultConfig } from '@angular/cdk/overlay';
import { MatIconRegistry } from '@angular/material/icon';
import { MAT_SELECT_CONFIG, MatSelectConfig } from '@angular/material/select';
import { OAuthStorage, provideOAuthClient } from 'angular-oauth2-oidc';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { AuthService } from './core/auth.service';
import { ErrorHttpInterceptor } from './core/error-http-interceptor.service';
import { onTabViewTransition } from './core/navigation/tab-transition';
import { provideOverlayBack } from './core/overlay/overlay-back.providers';
import { HistoryTrailService } from './core/navigation/history-trail.service';

registerLocaleData(localeDe);

function storageFactory(): OAuthStorage {
  return localStorage;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection(),
    // Slide-Animation beim Tab-Wechsel (AC4), siehe tab-transition.ts und styles.scss
    provideRouter(routes, withViewTransitions({ skipInitialTransition: true, onViewTransitionCreated: onTabViewTransition })),
    // Zurück schließt zuerst Sheet, Dialog oder Menü (AC6)
    provideOverlayBack(),
    // Spur der Router-Einträge ab der ersten Navigation (Seiten nach Speichern/Löschen per Zurück verlassen)
    provideAppInitializer(() => {
      inject(HistoryTrailService);
    }),
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
    // registriert auch den DefaultOAuthInterceptor (HTTP_INTERCEPTORS, braucht withInterceptorsFromDi)
    provideOAuthClient({
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
    // nach provideOAuthClient: Reihenfolge OAuth-Interceptor zuerst, dann Error-Interceptor (wie vor dem Upgrade)
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorHttpInterceptor,
      multi: true
    },
    {
      // nach provideOAuthClient, damit dessen Standard-Storage ueberschrieben wird
      provide: OAuthStorage,
      useFactory: storageFactory
    },
    provideAnimations(),
    provideServiceWorker('custom-sw.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
    // vorher im Konstruktor des AppModule
    provideEnvironmentInitializer(() => {
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
    }),
    provideAppInitializer(() => {
      inject(AuthService).init();
    }),
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
    DatePipe
  ]
};
