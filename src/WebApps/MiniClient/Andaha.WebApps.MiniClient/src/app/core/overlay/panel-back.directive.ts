import { DestroyRef, Directive, OnInit, inject } from '@angular/core';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatDatepicker } from '@angular/material/datepicker';
import { MatSelect } from '@angular/material/select';
import { Observable, Subscription, filter } from 'rxjs';
import { OverlayBackService } from './overlay-back.service';

/** Ein Datepicker schließt während seiner Öffnen-Animation nicht; dann danach noch einmal versuchen */
const DATEPICKER_RETRY_MS = 250;

/**
 * Zurück schließt zuerst ein offenes Auswahl-Panel, statt die Seite zu verlassen (AC6, Review I3):
 * Datepicker (auch der Vollbild-Dialog mit `touchUi`), Select und Autocomplete sind CDK-Overlays,
 * keine MatDialogs, und werden daher nicht von `provideOverlayBack` erfasst.
 *
 * Wirkt ohne eigenes Attribut auf jedes `mat-datepicker`, `mat-select` und jeden `[matAutocomplete]`-
 * Trigger im Template einer Komponente, die die Direktive importiert.
 */
@Directive({
  selector: 'mat-datepicker, mat-select, [matAutocomplete]'
})
export class PanelBackDirective implements OnInit {
  private readonly overlayBack = inject(OverlayBackService);
  private readonly datepicker = inject(MatDatepicker, { self: true, optional: true });
  private readonly select = inject(MatSelect, { self: true, optional: true });
  private readonly autocomplete = inject(MatAutocompleteTrigger, { self: true, optional: true });
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const datepicker = this.datepicker;
    const select = this.select;
    const autocomplete = this.autocomplete;

    if (datepicker) {
      this.bind(datepicker.openedStream, datepicker.closedStream, () => {
        datepicker.close();
        if (datepicker.opened) {
          setTimeout(() => datepicker.close(), DATEPICKER_RETRY_MS);
        }
      });
    } else if (select) {
      this.bind(select.openedChange.pipe(filter(open => open)), select.openedChange.pipe(filter(open => !open)), () => select.close());
    } else if (autocomplete?.autocomplete) {
      // öffnet und schließt auch beim Tippen (Treffer da/weg); jedes Öffnen bekommt einen Eintrag
      this.bind(autocomplete.autocomplete.opened, autocomplete.autocomplete.closed, () => autocomplete.closePanel());
    }
  }

  private bind(opened: Observable<unknown>, closed: Observable<unknown>, close: () => void): void {
    let release: (() => void) | null = null;
    const subscriptions = new Subscription();

    subscriptions.add(opened.subscribe(() => {
      release?.();
      release = this.overlayBack.register(close);
    }));
    subscriptions.add(closed.subscribe(() => {
      release?.();
      release = null;
    }));

    this.destroyRef.onDestroy(() => {
      subscriptions.unsubscribe();
      release?.();
    });
  }
}
