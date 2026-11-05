import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PullToRefreshDirective } from './pull-to-refresh.directive';

@Component({
  imports: [PullToRefreshDirective],
  template: `
    <div #indicator class="ptr"></div>
    <div class="list" style="height: 200px; overflow-y: auto"
      [appPullToRefresh]="indicator" [refreshing]="refreshing()" (refresh)="refreshed = refreshed + 1">
      <div style="height: 1000px"></div>
    </div>`
})
class HostComponent {
  readonly refreshing = signal(false);
  refreshed = 0;
}

describe('PullToRefreshDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let list: HTMLElement;
  let indicator: HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    list = fixture.nativeElement.querySelector('.list');
    indicator = fixture.nativeElement.querySelector('.ptr');
  });

  function pull(dy: number): void {
    const touch = (clientY: number) => new Touch({ identifier: 1, target: list, clientX: 100, clientY });
    list.dispatchEvent(new TouchEvent('touchstart', { touches: [touch(100)], changedTouches: [touch(100)], bubbles: true }));
    list.dispatchEvent(new TouchEvent('touchmove', { touches: [touch(100 + dy)], changedTouches: [touch(100 + dy)], bubbles: true }));
    list.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touch(100 + dy)], bubbles: true }));
  }

  it('refreshes after pulling down far enough at the top', () => {
    pull(200);
    expect(fixture.componentInstance.refreshed).toBe(1);
    expect(indicator.classList.contains('spinning')).toBe(true);
  });

  it('does not refresh for a short pull', () => {
    pull(40);
    expect(fixture.componentInstance.refreshed).toBe(0);
  });

  it('only starts at scrollTop 0', () => {
    list.scrollTop = 50;
    pull(200);
    expect(fixture.componentInstance.refreshed).toBe(0);
  });

  it('hides the indicator once loading is done', async () => {
    pull(200);
    fixture.componentInstance.refreshing.set(true);
    fixture.detectChanges();
    fixture.componentInstance.refreshing.set(false);
    fixture.detectChanges();

    await vi.waitFor(() => expect(indicator.classList.contains('spinning')).toBe(false), { timeout: 2000 });
  });
});
