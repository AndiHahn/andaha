import { MatSnackBar } from '@angular/material/snack-bar';
import { openSuccessSnackbar } from './snackbar-functions';
import { SuccessSnackbarComponent } from './success-snackbar/success-snackbar.component';

describe('openSuccessSnackbar', () => {
  it('opens a 4 s, polite, action-less success snackbar', () => {
    const openFromComponent = vi.fn();
    openSuccessSnackbar('Gespeichert · Rewe 12,50', { openFromComponent } as unknown as MatSnackBar);
    expect(openFromComponent).toHaveBeenCalledTimes(1);
    const [component, config] = openFromComponent.mock.calls[0];
    expect(component).toBe(SuccessSnackbarComponent);
    expect(config.data).toBe('Gespeichert · Rewe 12,50');
    expect(config.duration).toBe(4000);
    expect(config.politeness).toBe('polite');
    expect(config.panelClass).toEqual(['andaha-snackbar', 'andaha-snackbar-success']);
  });
});
