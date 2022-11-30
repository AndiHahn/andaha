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
    this.oauthService.loadDiscoveryDocumentAndTryLogin()
      .then(_ => {
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
    return this.isAuthenticated$.asObservable();
  }

  userInfo(): Observable<UserAuthInfo> {
    return this.userAuthInfo$.asObservable();
  }

  private buildAndRaiseAuthInfo() {
    this.oauthService.loadUserProfile().then(userProfile => {
      const userProfileClaims = userProfile as any;

      if (userProfileClaims) {

        const authInfo: UserAuthInfo = {
          userName: userProfileClaims.info.name,
          userEmail: userProfileClaims.info.email
        }
        
        this.userAuthInfo$.next(authInfo);
      }
    });
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
