import { TestBed } from '@angular/core/testing';
import { OnlineStatusService } from './online-status.service';

describe('OnlineStatusService', () => {
  it('follows online/offline events', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const service = TestBed.inject(OnlineStatusService);
    expect(service.online()).toBe(true);

    window.dispatchEvent(new Event('offline'));
    expect(service.online()).toBe(false);

    window.dispatchEvent(new Event('online'));
    expect(service.online()).toBe(true);
  });

  it('starts offline when the browser is offline', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect(TestBed.inject(OnlineStatusService).online()).toBe(false);
  });
});
