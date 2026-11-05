import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { asapScheduler, BehaviorSubject, Observable } from 'rxjs';
import { observeOn } from 'rxjs/operators';

/** Icon-Button rechts in der Kopfzeile (z. B. Verlauf auf Detailseiten), gilt bis zur nächsten Navigation. */
export interface HeaderAction {
  icon: string;
  label: string;
  run: () => void;
}

@Injectable({ providedIn: 'root' })
export class PageTitleService {
  private readonly router = inject(Router);

  private readonly titleSubject = new BehaviorSubject<string>('');
  private readonly backSubject = new BehaviorSubject<string | null>(null);
  private readonly actionSubject = new BehaviorSubject<HeaderAction | null>(null);

  // Titel und Aktion werden von Seitenkomponenten in ngOnInit gesetzt, also während die Kopfzeile
  // (app.component) im selben Change-Detection-Durchlauf schon geprüft ist. Die Auslieferung nach dem
  // Durchlauf (asapScheduler) verhindert ExpressionChangedAfterItHasBeenCheckedError.
  readonly title$: Observable<string> = this.titleSubject.pipe(observeOn(asapScheduler));
  readonly back$: Observable<string | null> = this.backSubject.asObservable();
  readonly action$: Observable<HeaderAction | null> = this.actionSubject.pipe(observeOn(asapScheduler));

  /** Überschreibt `data.back`, gesetzt von der Seitenkomponente während der Navigation */
  private backOverride: string | null = null;

  constructor() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.backOverride = null;
      } else if (event instanceof NavigationEnd) {
        this.update();
      }
    });
  }

  set(title: string): void {
    this.titleSubject.next(title);
  }

  setAction(action: HeaderAction | null): void {
    this.actionSubject.next(action);
  }

  /**
   * Zurück-Ziel der aktuellen Seite überschreiben (statt `data.back` der Route), z. B. wenn die Seite
   * von einer Detailseite aus geöffnet wurde. Gilt bis zur nächsten Navigation.
   */
  setBack(url: string | null): void {
    this.backOverride = url;
    // wie der Titel erst nach dem laufenden Change-Detection-Durchlauf
    asapScheduler.schedule(() => this.backSubject.next(url));
  }

  private update(): void {
    let title = '';
    let back: string | null = null;
    let route: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;
    while (route) {
      const data = route.data ?? {};
      if (typeof data['title'] === 'string') {
        title = data['title'];
      }
      if (typeof data['back'] === 'string') {
        back = data['back'];
      }
      route = route.firstChild;
    }
    this.titleSubject.next(title);
    this.backSubject.next(this.backOverride ?? back);
    this.actionSubject.next(null);
  }
}
