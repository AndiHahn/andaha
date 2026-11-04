import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, take } from 'rxjs/operators';
import { openInformationSnackbar } from '../shared/snackbar/snackbar-functions';

@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private swUpdate = inject(SwUpdate);
  private snackbar = inject(MatSnackBar);


  init(): void {
    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => {
        openInformationSnackbar('Neue Version verfügbar', this.snackbar, { action: 'Neu laden', duration: null })
          .onAction()
          .pipe(take(1))
          .subscribe(() => this.swUpdate.activateUpdate().catch(() => undefined).then(() => this.reload()));
      });

    this.swUpdate.unrecoverable.subscribe(() => {
      openInformationSnackbar('Die App muss neu geladen werden.', this.snackbar, { action: 'Neu laden', duration: null })
        .onAction()
        .pipe(take(1))
        .subscribe(() => this.reload());
    });
  }

  protected reload(): void {
    document.location.reload();
  }
}
