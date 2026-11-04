import type { Mock } from "vitest";
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { AppUpdateService } from './app-update.service';

@Injectable()
class TestableAppUpdateService extends AppUpdateService {
    override reload = vi.fn().mockName('reload');
}

describe('AppUpdateService', () => {
    let versionUpdates: Subject<any>;
    let unrecoverable: Subject<any>;
    let swUpdate: any;
    let onAction: Subject<void>;
    let snackbar: {
        openFromComponent: Mock;
    };
    let service: TestableAppUpdateService;

    beforeEach(() => {
        versionUpdates = new Subject();
        unrecoverable = new Subject();
        onAction = new Subject<void>();
        swUpdate = {
            versionUpdates,
            unrecoverable,
            isEnabled: true,
            activateUpdate: vi.fn().mockName('activateUpdate').mockResolvedValue(true)
        };
        snackbar = { openFromComponent: vi.fn().mockName('openFromComponent').mockReturnValue({ onAction: () => onAction }) };

        TestBed.configureTestingModule({
            providers: [
                { provide: SwUpdate, useValue: swUpdate },
                { provide: MatSnackBar, useValue: snackbar },
                { provide: AppUpdateService, useClass: TestableAppUpdateService }
            ]
        });
        service = TestBed.inject(AppUpdateService) as TestableAppUpdateService;
        service.init();
    });

    it('does not reload when version is ready', () => {
        versionUpdates.next({ type: 'VERSION_READY' });

        expect(service.reload).not.toHaveBeenCalled();
        expect(swUpdate.activateUpdate).not.toHaveBeenCalled();
        expect(snackbar.openFromComponent).toHaveBeenCalledTimes(1);
        const config = vi.mocked(snackbar.openFromComponent).mock.lastCall![1];
        expect(config.data).toEqual({ message: 'Neue Version verfügbar', action: 'Neu laden' });
        expect(config.duration).toBeUndefined();
    });

    it('reloads after action', async () => {
        versionUpdates.next({ type: 'VERSION_READY' });
        onAction.next();
        await Promise.resolve();
        await Promise.resolve();

        expect(swUpdate.activateUpdate).toHaveBeenCalled();
        expect(service.reload).toHaveBeenCalled();
    });

    it('reloads even if activateUpdate rejects', async () => {
        swUpdate.activateUpdate.mockRejectedValue(new Error('fail'));
        versionUpdates.next({ type: 'VERSION_READY' });
        onAction.next();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();

        expect(service.reload).toHaveBeenCalled();
    });

    it('prompts on unrecoverable state', () => {
        unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'x' });

        expect(vi.mocked(snackbar.openFromComponent).mock.lastCall![1].data.message).toBe('Die App muss neu geladen werden.');
        onAction.next();
        expect(service.reload).toHaveBeenCalled();
    });

    it('ignores other version events', () => {
        versionUpdates.next({ type: 'VERSION_DETECTED' });

        expect(snackbar.openFromComponent).not.toHaveBeenCalled();
    });
});
