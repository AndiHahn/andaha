import { EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';
import { MAT_DIALOG_DEFAULT_OPTIONS, MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { OverlayBackService } from './overlay-back.service';

/**
 * Dialoge zentral beim OverlayBackService anmelden: jeder über MatDialog geöffnete Dialog (auch aus
 * Kind-Injektoren, die afterOpened an den Root-Dialog weiterreichen) schließt bei Zurück zuerst.
 */
export function provideOverlayBack(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      // Zurück übernimmt der OverlayBackService (nur der oberste Dialog schließt); mit dem Standard
      // würde die CDK bei jedem popstate alle Dialoge auf einmal schließen
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: { ...new MatDialogConfig(), closeOnNavigation: false } as MatDialogConfig
    },
    provideAppInitializer(() => {
      const overlayBack = inject(OverlayBackService);
      inject(MatDialog).afterOpened.subscribe(ref => {
        const release = overlayBack.register(() => ref.close());
        ref.afterClosed().subscribe(release);
      });
    })
  ]);
}
