import { Injectable, inject } from '@angular/core';
import { ComponentType } from '@angular/cdk/portal';
import { MatBottomSheet, MatBottomSheetConfig, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { OverlayBackService } from './overlay-back.service';

/**
 * Einziger Weg, ein Bottom Sheet zu öffnen: Panel-Klasse `andaha-sheet` und Anmeldung beim
 * OverlayBackService (Zurück schließt das Sheet, AC6). Den Griff mit `appSheetDrag` ausstatten.
 */
@Injectable({ providedIn: 'root' })
export class SheetService {
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly overlayBack = inject(OverlayBackService);

  open<T, D = unknown, R = unknown>(component: ComponentType<T>, config?: MatBottomSheetConfig<D>): MatBottomSheetRef<T, R> {
    const panelClass = ['andaha-sheet', ...[config?.panelClass ?? []].flat()];
    const ref = this.bottomSheet.open<T, D, R>(component, {
      // Zurück übernimmt der OverlayBackService; die CDK würde sonst bei jedem popstate schließen
      closeOnNavigation: false,
      ...config,
      panelClass
    });

    const release = this.overlayBack.register(() => ref.dismiss());
    ref.afterDismissed().subscribe(release);
    return ref;
  }
}
