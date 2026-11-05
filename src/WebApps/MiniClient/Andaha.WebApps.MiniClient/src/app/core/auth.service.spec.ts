import type { MockedObject } from "vitest";
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { OAuthErrorEvent, OAuthEvent, OAuthService, OAuthSuccessEvent } from 'angular-oauth2-oidc';
import { firstValueFrom, Subject } from 'rxjs';
import { AuthService, tryLoginOptions } from './auth.service';
import { OverlayBackService } from './overlay/overlay-back.service';

describe('AuthService', () => {
    const key = 'andaha.auth.lastIdp';
    let service: AuthService;
    let oauth: MockedObject<OAuthService>;
    let overlayBack: { leaveDocument: ReturnType<typeof vi.fn> };
    let events: Subject<OAuthEvent>;
    let expiresAt: number | null;
    let discoveryCalls: number;

    const hour = 3600000;
    const valid = () => { expiresAt = Date.now() + hour; oauth.hasValidAccessToken.mockReturnValue(true); };
    const expire = () => { expiresAt = null; oauth.hasValidAccessToken.mockReturnValue(false); };
    const refused = () => new HttpErrorResponse({ status: 400 });

    const flush = async () => {
        for (let i = 0; i < 10; i++) {
            await Promise.resolve();
        }
    };

    const fireVisible = () => {
        vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
        document.dispatchEvent(new Event('visibilitychange'));
    };

    // the service registers app-lifetime listeners; remove them again so services of earlier tests stay silent
    let removeListeners: () => void;

    beforeEach(() => {
        const added: Array<[
            EventTarget,
            string,
            any
        ]> = [];
        for (const target of [document, window] as EventTarget[]) {
            const original = target.addEventListener.bind(target);
            vi.spyOn(target, 'addEventListener').mockImplementation((type: string, listener: any, options?: any) => {
                added.push([target, type, listener]);
                original(type, listener, options);
            });
        }
        removeListeners = () => added.forEach(([t, type, l]) => t.removeEventListener(type, l));
        localStorage.removeItem(key);
        events = new Subject<OAuthEvent>();
        oauth = {
            configure: vi.fn().mockName("OAuthService.configure"),
            setupAutomaticSilentRefresh: vi.fn().mockName("OAuthService.setupAutomaticSilentRefresh"),
            loadDiscoveryDocument: vi.fn().mockName("OAuthService.loadDiscoveryDocument"),
            tryLogin: vi.fn().mockName("OAuthService.tryLogin"),
            hasValidAccessToken: vi.fn().mockName("OAuthService.hasValidAccessToken"),
            getAccessTokenExpiration: vi.fn().mockName("OAuthService.getAccessTokenExpiration"),
            getRefreshToken: vi.fn().mockName("OAuthService.getRefreshToken"),
            refreshToken: vi.fn().mockName("OAuthService.refreshToken"),
            initLoginFlow: vi.fn().mockName("OAuthService.initLoginFlow"),
            getIdentityClaims: vi.fn().mockName("OAuthService.getIdentityClaims"),
            logOut: vi.fn().mockName("OAuthService.logOut"),
            silentRefresh: vi.fn().mockName("OAuthService.silentRefresh")
        } as unknown as MockedObject<OAuthService>;
        (oauth as any).events = events;
        expiresAt = null;
        discoveryCalls = 0;
        oauth.loadDiscoveryDocument.mockImplementation(async () => {
            discoveryCalls++;
            (oauth as any).discoveryDocumentLoaded = true;
            return {} as any;
        });
        oauth.getAccessTokenExpiration.mockImplementation(() => expiresAt as any);
        oauth.tryLogin.mockResolvedValue(true);
        oauth.hasValidAccessToken.mockReturnValue(false);
        oauth.getRefreshToken.mockReturnValue(null as any);
        oauth.refreshToken.mockResolvedValue({} as any);
        oauth.getIdentityClaims.mockReturnValue({ name: 'Andi', emails: ['andi@example.com'], idp: 'google.com' });

        overlayBack = { leaveDocument: vi.fn().mockName('OverlayBackService.leaveDocument') };
        TestBed.configureTestingModule({
            providers: [
                { provide: OAuthService, useValue: oauth },
                { provide: OverlayBackService, useValue: overlayBack }
            ]
        });
        service = TestBed.inject(AuthService);
    });

    afterEach(() => {
        removeListeners();
        localStorage.removeItem(key);
    });

    it('does not start a login flow when the access token is still valid', async () => {
        valid();
        await service.init();
        expect(oauth.initLoginFlow).not.toHaveBeenCalled();
        expect(oauth.refreshToken).not.toHaveBeenCalled();
        expect(await firstValueFrom(service.loggedIn())).toBe(true);
    });

    it('redeems the refresh token at startup when the access token expired', async () => {
        expire();
        oauth.getRefreshToken.mockReturnValue('rt');
        await service.init();
        expect(oauth.refreshToken).toHaveBeenCalledTimes(1);
        expect(oauth.initLoginFlow).not.toHaveBeenCalled();
        expect(await firstValueFrom(service.loggedIn())).toBe(true);
        expect(await firstValueFrom(service.userInfo())).toEqual({ userName: 'Andi', userEmail: 'andi@example.com' });
    });

    it('starts the login flow with the remembered idp as domain_hint when the refresh fails', async () => {
        localStorage.setItem(key, 'google.com');
        oauth.getRefreshToken.mockReturnValue('rt');
        oauth.refreshToken.mockRejectedValue(refused());
        await service.init();
        expect(oauth.initLoginFlow).toHaveBeenCalledWith('', { domain_hint: 'google.com' });
    });

    it('starts the login flow without hint when no idp is remembered', async () => {
        await service.init();
        expect(oauth.initLoginFlow).toHaveBeenCalledWith('', {});
    });

    it('remembers the idp claim after a successful login', async () => {
        valid();
        await service.init();
        expect(localStorage.getItem(key)).toBe('google.com');
    });

    it('tryLogin keeps history state when URL has no code', async () => {
        valid();

        // die URL des Testlaufs enthält keinen Login-Code: angular-oauth2-oidc darf history.replaceState(null, …) nicht aufrufen
        await service.init();

        expect(oauth.tryLogin).toHaveBeenCalledWith({ preventClearHashAfterLogin: true });
    });

    it('tryLogin clears hash only when code present', () => {
        expect(tryLoginOptions('?code=abc&state=xyz', '')).toEqual({ preventClearHashAfterLogin: false });
        expect(tryLoginOptions('', '#code=abc&state=xyz')).toEqual({ preventClearHashAfterLogin: false });
        // auch eine Fehlerantwort des Login-Servers wird aus der URL entfernt
        expect(tryLoginOptions('?error=access_denied&state=xyz', '')).toEqual({ preventClearHashAfterLogin: false });

        expect(tryLoginOptions('', '')).toEqual({ preventClearHashAfterLogin: true });
        expect(tryLoginOptions('?shopName=Billa&codex=1', '')).toEqual({ preventClearHashAfterLogin: true });
    });

    it('forgets the idp for local accounts', async () => {
        localStorage.setItem(key, 'google.com');
        valid();
        oauth.getIdentityClaims.mockReturnValue({ name: 'Andi', emails: ['andi@example.com'] });
        await service.init();
        expect(localStorage.getItem(key)).toBeNull();
    });

    it('drops the remembered idp and redirects once without hint when the login response has an error', async () => {
        localStorage.setItem(key, 'google.com');
        oauth.tryLogin.mockRejectedValue(new OAuthErrorEvent('code_error', {}));
        await service.init();
        await flush();
        expect(localStorage.getItem(key)).toBeNull();
        expect(oauth.initLoginFlow).toHaveBeenCalledTimes(1);
        expect(oauth.initLoginFlow).toHaveBeenCalledWith('', {});
    });

    it('does not redirect after a login error when no idp is remembered', async () => {
        oauth.tryLogin.mockRejectedValue(new OAuthErrorEvent('code_error', {}));
        await service.init();
        await flush();
        expect(oauth.initLoginFlow).not.toHaveBeenCalled();
    });

    it('starts the session check on token_refresh_error when the access token is no longer valid', async () => {
        valid();
        await service.init();
        expire();
        localStorage.setItem(key, 'google.com');
        events.next(new OAuthErrorEvent('token_refresh_error', {}));
        await flush();
        expect(oauth.initLoginFlow).toHaveBeenCalledWith('', { domain_hint: 'google.com' });
    });

    it('ignores token_refresh_error while the access token is still valid', async () => {
        valid();
        await service.init();
        events.next(new OAuthErrorEvent('token_refresh_error', {}));
        await flush();
        expect(oauth.initLoginFlow).not.toHaveBeenCalled();
    });

    it('checks the session when the app becomes visible again', async () => {
        valid();
        await service.init();
        expire();
        oauth.getRefreshToken.mockReturnValue('rt');
        fireVisible();
        await flush();
        expect(oauth.refreshToken).toHaveBeenCalledTimes(1);
    });

    it('runs only one session check at a time', async () => {
        valid();
        await service.init();
        expire();
        oauth.getRefreshToken.mockReturnValue('rt');
        oauth.refreshToken.mockReturnValue(new Promise(() => { }));
        vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
        document.dispatchEvent(new Event('visibilitychange'));
        document.dispatchEvent(new Event('visibilitychange'));
        await flush();
        expect(oauth.refreshToken).toHaveBeenCalledTimes(1);
    });

    it('ignores visibilitychange before the discovery document is loaded', async () => {
        oauth.loadDiscoveryDocument.mockReturnValue(new Promise(() => { }));
        oauth.getRefreshToken.mockReturnValue('rt');
        service.init();
        fireVisible();
        await flush();
        expect(oauth.refreshToken).not.toHaveBeenCalled();
        expect(oauth.initLoginFlow).not.toHaveBeenCalled();
    });

    it('logout forgets the remembered idp', () => {
        localStorage.setItem(key, 'google.com');
        service.logout();
        expect(localStorage.getItem(key)).toBeNull();
        expect(oauth.logOut).toHaveBeenCalledTimes(1);
    });

    it('logout stops overlay history steps before leaving the app', () => {
        service.logout();
        expect(overlayBack.leaveDocument).toHaveBeenCalledTimes(1);
        expect(overlayBack.leaveDocument.mock.invocationCallOrder[0])
            .toBeLessThan(oauth.logOut.mock.invocationCallOrder[0]);
    });

    describe('fix wave', () => {
        it('starts the login with the remembered idp when a resume refresh is refused (400)', async () => {
            valid();
            await service.init();
            expire();
            localStorage.setItem(key, 'google.com');
            oauth.getRefreshToken.mockReturnValue('rt');
            oauth.refreshToken.mockRejectedValue(refused());
            fireVisible();
            await flush();
            expect(oauth.initLoginFlow).toHaveBeenCalledTimes(1);
            expect(oauth.initLoginFlow).toHaveBeenCalledWith('', { domain_hint: 'google.com' });
        });

        it('starts only one login when the failing refresh also emits token_refresh_error', async () => {
            oauth.getRefreshToken.mockReturnValue('rt');
            oauth.refreshToken.mockImplementation(() => {
                events.next(new OAuthErrorEvent('token_refresh_error', {}));
                return Promise.reject(refused());
            });
            await service.init();
            await flush();
            expect(oauth.refreshToken).toHaveBeenCalledTimes(1);
            expect(oauth.initLoginFlow).toHaveBeenCalledTimes(1);
        });

        it('does one refresh and at most one redirect for visibility plus token_refresh_error', async () => {
            valid();
            await service.init();
            expire();
            oauth.getRefreshToken.mockReturnValue('rt');
            oauth.refreshToken.mockRejectedValue(refused());
            events.next(new OAuthErrorEvent('token_refresh_error', {}));
            fireVisible();
            await flush();
            expect(oauth.refreshToken).toHaveBeenCalledTimes(1);
            expect(oauth.initLoginFlow).toHaveBeenCalledTimes(1);
        });

        it('does not navigate when the refresh fails with a network error (status 0)', async () => {
            oauth.getRefreshToken.mockReturnValue('rt');
            oauth.refreshToken.mockRejectedValue(new HttpErrorResponse({ status: 0 }));
            await service.init();
            expect(oauth.initLoginFlow).not.toHaveBeenCalled();
        });

        it('does not navigate while offline without refresh token and checks again on the online event', async () => {
            valid();
            await service.init();
            expire();
            const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
            fireVisible();
            await flush();
            expect(oauth.initLoginFlow).not.toHaveBeenCalled();
            online.mockReturnValue(true);
            window.dispatchEvent(new Event('online'));
            await flush();
            expect(oauth.initLoginFlow).toHaveBeenCalledTimes(1);
            expect(oauth.initLoginFlow).toHaveBeenCalledWith('', { domain_hint: 'google.com' });
        });

        describe('automatic refresh failure while the token is still valid', () => {
            beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date()); });
            afterEach(() => vi.useRealTimers());

            it('schedules the session check for the token expiry', async () => {
                valid();
                await service.init();
                oauth.getRefreshToken.mockReturnValue('rt');
                events.next(new OAuthErrorEvent('token_refresh_error', {}));
                await flush();
                expect(oauth.initLoginFlow).not.toHaveBeenCalled();
                expect(oauth.refreshToken).not.toHaveBeenCalled();
                vi.advanceTimersByTime(hour + 1);
                await flush();
                expect(oauth.refreshToken).toHaveBeenCalledTimes(1);
            });

            it('cancels the timer on token_received', async () => {
                valid();
                await service.init();
                oauth.getRefreshToken.mockReturnValue('rt');
                events.next(new OAuthErrorEvent('token_refresh_error', {}));
                events.next(new OAuthSuccessEvent('token_received'));
                vi.advanceTimersByTime(hour + 1);
                await flush();
                expect(oauth.refreshToken).not.toHaveBeenCalled();
            });
        });

        it('emits loggedIn true only once for repeated visibility changes with a valid token', async () => {
            const emitted: boolean[] = [];
            service.loggedIn().subscribe(v => emitted.push(v));
            valid();
            await service.init();
            vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
            document.dispatchEvent(new Event('visibilitychange'));
            await flush();
            document.dispatchEvent(new Event('visibilitychange'));
            await flush();
            expect(emitted.filter(v => v).length).toBe(1);
        });

        it('refreshes first when the token expires within 30 seconds at startup', async () => {
            expiresAt = Date.now() + 30000;
            oauth.hasValidAccessToken.mockReturnValue(true);
            oauth.getRefreshToken.mockReturnValue('rt');
            await service.init();
            expect(oauth.refreshToken).toHaveBeenCalledTimes(1);
        });

        it('resolves init when discovery fails and reloads discovery on the next visible event', async () => {
            let fail = true;
            oauth.loadDiscoveryDocument.mockImplementation(async () => {
                discoveryCalls++;
                if (fail) {
                    throw new Error('offline');
                }
                (oauth as any).discoveryDocumentLoaded = true;
                return {} as any;
            });
            oauth.getRefreshToken.mockReturnValue('rt');
            await expect(service.init()).resolves.toBeUndefined();
            expect(oauth.initLoginFlow).not.toHaveBeenCalled();
            fail = false;
            fireVisible();
            await flush();
            expect(discoveryCalls).toBe(2);
            expect(oauth.refreshToken).toHaveBeenCalledTimes(1);
        });

        it('ignores visible while tryLogin is still pending', async () => {
            oauth.tryLogin.mockReturnValue(new Promise(() => { }));
            oauth.getRefreshToken.mockReturnValue('rt');
            service.init();
            await flush();
            fireVisible();
            await flush();
            expect(oauth.refreshToken).not.toHaveBeenCalled();
            expect(oauth.initLoginFlow).not.toHaveBeenCalled();
        });
    });
});
