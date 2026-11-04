import { DestroyRef, Directive, inject } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { OverlayBackService } from './overlay-back.service';

/** An `matMenuTriggerFor`-Triggern: Zurück schließt das offene Menü, statt zu navigieren (AC6). */
@Directive({
  selector: '[matMenuTriggerFor][appMenuBack]'
})
export class MenuBackDirective {
  constructor() {
    const trigger = inject(MatMenuTrigger);
    const overlayBack = inject(OverlayBackService);
    let release: (() => void) | null = null;

    const opened = trigger.menuOpened.subscribe(() => {
      release?.();
      release = overlayBack.register(() => trigger.closeMenu());
    });
    const closed = trigger.menuClosed.subscribe(() => {
      release?.();
      release = null;
    });

    inject(DestroyRef).onDestroy(() => {
      opened.unsubscribe();
      closed.unsubscribe();
      release?.();
    });
  }
}
