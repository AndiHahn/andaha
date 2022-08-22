import { Injectable } from '@angular/core';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private isAuthenticatedSubject: BehaviorSubject<boolean> = new BehaviorSubject(this.isLoggedIn());

  constructor(private oauthService: OAuthService) { }

  init() {
    this.oauthService.configure(this.getCodeFlowConfig());
    this.oauthService.loadDiscoveryDocumentAndTryLogin()
      .then(_ => {
          if (this.oauthService.hasValidAccessToken() && this.oauthService.hasValidIdToken()) {
            this.isAuthenticatedSubject.next(true);
            return Promise.resolve();
          } else {
              return new Promise(resolve => {
                  this.oauthService.initLoginFlow();
                  resolve(true);
              });
          }
      });

    this.oauthService.setupAutomaticSilentRefresh();
  }

  login(): void {
    this.oauthService.initLoginFlow();
  }

  logout(): void {
    this.oauthService.logOut();
  }

  isLoggedIn(): boolean {
    return this.oauthService.hasValidAccessToken();
  }

  loggedIn(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  private getCodeFlowConfig(): AuthConfig {
    return {
      issuer: environment.authIssuerUrl,
      loginUrl: environment.authIssuerUrl + '/connect/authorize',
      tokenEndpoint: environment.authIssuerUrl + 'connect/token',
      redirectUri: environment.authRedirectUrl,
      clientId: environment.authClientId,
      responseType: environment.authResponseType,
      scope: environment.authScope,
      showDebugInformation: environment.authShowDebugInformation
    }
  };
}
