import { Injectable } from '@angular/core';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserAuthInfo } from './UserAuthInfo';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private isAuthenticated$: BehaviorSubject<boolean> = new BehaviorSubject(this.isLoggedIn());
  private userAuthInfo$: BehaviorSubject<UserAuthInfo> = new BehaviorSubject<UserAuthInfo>({ userName: '', userEmail: '' });

  constructor(private oauthService: OAuthService) { }

  init() {
    this.oauthService.configure(this.getCodeFlowConfig());

    this.oauthService.setupAutomaticSilentRefresh();

    const openidConfigurationUrl = `https://${environment.loginDomain}/${environment.authTenant}.onmicrosoft.com/${environment.authPolicy}/v2.0/.well-known/openid-configuration`;

    this.oauthService
      .loadDiscoveryDocument(openidConfigurationUrl).then(_ =>
        this.oauthService.tryLogin().then(_ => {
          if (this.oauthService.hasValidAccessToken()) {
            this.isAuthenticated$.next(true);
            this.buildAndRaiseAuthInfo();
            return Promise.resolve();
          } else {
            return new Promise(resolve => {
              this.oauthService.initLoginFlow();
              resolve(true);
            });
          }
    }));
  }

  login(): void {
    if (!this.oauthService.hasValidAccessToken()) {
      this.oauthService.silentRefresh();
    } else {
      this.oauthService.initLoginFlow();
    }
  }

  logout(): void {
    this.oauthService.logOut();
  }

  isLoggedIn(): boolean {
    return this.oauthService.hasValidAccessToken();
  }

  loggedIn(): Observable<boolean> {
    return this.isAuthenticated$.asObservable();
  }

  userInfo(): Observable<UserAuthInfo> {
    return this.userAuthInfo$.asObservable();
  }

  private buildAndRaiseAuthInfo() {
    const claims = this.oauthService.getIdentityClaims() as any;
    if (claims) {
      const authInfo: UserAuthInfo = {
        userName: claims.name,
        userEmail: claims.emails[0]
      }
      
      this.userAuthInfo$.next(authInfo);
    }
  }

  private getCodeFlowConfig(): AuthConfig {
    return {
      issuer: `https://${environment.loginDomain}/${environment.authTenantId}/v2.0/`,
      loginUrl: `https://${environment.loginDomain}/${environment.authTenant}.onmicrosoft.com/oauth2/v2.0/authorize?p=${environment.authPolicy}`,
      logoutUrl: `https://${environment.loginDomain}/${environment.authTenant}.onmicrosoft.com/oauth2/v2.0/logout?p=${environment.authPolicy}`,
      tokenEndpoint: `https://${environment.loginDomain}/${environment.authTenant}.onmicrosoft.com/oauth2/v2.0/token?p=${environment.authPolicy}`,
      scope: 'openid offline_access ' + environment.authScope,
      strictDiscoveryDocumentValidation: false,
      clientId: environment.authClientId,
      redirectUri: environment.authRedirectUrl,
      responseType: environment.authResponseType,
      showDebugInformation: environment.authShowDebugInformation
    }
  };
}
