import { Injectable, inject } from '@angular/core';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserAuthInfo } from './UserAuthInfo';
import { OverlayBackService } from './overlay/overlay-back.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private oauthService = inject(OAuthService);
  private overlayBack = inject(OverlayBackService);


  private isAuthenticated$: BehaviorSubject<boolean> = new BehaviorSubject(this.isLoggedIn());
  private userAuthInfo$: BehaviorSubject<UserAuthInfo> = new BehaviorSubject<UserAuthInfo>({ userName: '', userEmail: '' });

  private static readonly lastIdpKey = 'andaha.auth.lastIdp';
  private static readonly usableTokenMarginMs = 60_000;
  private sessionCheck?: Promise<void>;
  private listenersRegistered = false;
  private loginStarted = false;
  private expiryTimer?: ReturnType<typeof setTimeout>;

  init(): Promise<void> {
    this.oauthService.configure(this.getCodeFlowConfig());

    this.oauthService.setupAutomaticSilentRefresh();

    this.oauthService.events.subscribe(e => {
      if (e.type === 'token_received') {
        this.clearExpiryTimer();
      } else if (e.type === 'token_refresh_error') {
        this.onRefreshError();
      }
    });

    return this.loadDiscovery()
      .then(async () => {
        let loginFailed = false;
        try {
          await this.oauthService.tryLogin();
        } catch {
          loginFailed = true;
        }
        this.registerListeners();
        if (loginFailed) {
          this.handleLoginError();
        } else {
          await this.ensureSession();
        }
      }, () => this.registerListeners())
      .catch(() => undefined);
  }

  login(): void {
    if (!this.oauthService.hasValidAccessToken()) {
      this.oauthService.silentRefresh();
    } else {
      this.oauthService.initLoginFlow();
    }
  }

  logout(): void {
    localStorage.removeItem(AuthService.lastIdpKey);
    // Aufruf aus dem Kontomenü: das schließende Menü darf die Weiterleitung nicht per history.back abbrechen
    this.overlayBack.leaveDocument();
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

  private loadDiscovery(): Promise<object> {
    const openidConfigurationUrl = `https://${environment.loginDomain}/${environment.authTenant}.onmicrosoft.com/${environment.authPolicy}/v2.0/.well-known/openid-configuration`;
    return this.oauthService.loadDiscoveryDocument(openidConfigurationUrl);
  }

  private registerListeners(): void {
    if (this.listenersRegistered) {
      return;
    }
    this.listenersRegistered = true;
    const check = () => this.ensureSession().catch(() => undefined);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        check();
      }
    });
    window.addEventListener('online', check);
  }

  private hasUsableAccessToken(): boolean {
    return (this.oauthService.getAccessTokenExpiration() ?? 0) - Date.now() > AuthService.usableTokenMarginMs;
  }

  private onRefreshError(): void {
    if (!this.hasUsableAccessToken()) {
      this.ensureSession().catch(() => undefined);
      return;
    }
    // the automatic refresh failed while the token is still usable: retry once it has expired
    this.clearExpiryTimer();
    const delay = (this.oauthService.getAccessTokenExpiration() ?? 0) - Date.now();
    this.expiryTimer = setTimeout(() => {
      this.expiryTimer = undefined;
      this.ensureSession().catch(() => undefined);
    }, Math.max(delay, 0));
  }

  private clearExpiryTimer(): void {
    if (this.expiryTimer !== undefined) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = undefined;
    }
  }

  private ensureSession(): Promise<void> {
    if (!this.sessionCheck) {
      this.sessionCheck = Promise.resolve()
        .then(() => this.checkSession())
        .finally(() => this.sessionCheck = undefined);
    }
    return this.sessionCheck;
  }

  private async checkSession(): Promise<void> {
    if (!this.oauthService.discoveryDocumentLoaded) {
      try {
        await this.loadDiscovery();
      } catch {
        return;
      }
    }

    if (this.hasUsableAccessToken()) {
      this.markAuthenticated(false);
    } else if (this.oauthService.getRefreshToken()) {
      try {
        await this.oauthService.refreshToken();
      } catch (err) {
        if (this.isDefinitiveRefusal(err)) {
          this.startLogin();
        }
        return;
      }
      this.markAuthenticated(true);
    } else if (!this.isOffline()) {
      this.startLogin();
    }
  }

  private isOffline(): boolean {
    return navigator.onLine === false;
  }

  private isDefinitiveRefusal(err: any): boolean {
    if (this.isOffline()) {
      return false;
    }
    return err?.status === 400 || err?.status === 401 || err?.error?.error === 'invalid_grant';
  }

  private startLogin(): void {
    if (this.loginStarted) {
      return;
    }
    this.loginStarted = true;
    const idp = localStorage.getItem(AuthService.lastIdpKey);
    this.oauthService.initLoginFlow('', idp ? { domain_hint: idp } : {});
  }

  private markAuthenticated(forceEmit: boolean): void {
    if (forceEmit || !this.isAuthenticated$.value) {
      this.isAuthenticated$.next(true);
    }
    this.rememberIdp();
    this.buildAndRaiseAuthInfo();
  }

  private rememberIdp(): void {
    const claims = this.oauthService.getIdentityClaims() as any;
    if (claims?.idp) {
      localStorage.setItem(AuthService.lastIdpKey, claims.idp);
    } else {
      localStorage.removeItem(AuthService.lastIdpKey);
    }
  }

  private handleLoginError(): void {
    if (localStorage.getItem(AuthService.lastIdpKey)) {
      localStorage.removeItem(AuthService.lastIdpKey);
      this.startLogin();
    }
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
